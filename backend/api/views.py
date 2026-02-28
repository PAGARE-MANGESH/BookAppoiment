import random
from django.db import models
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Specialization, Doctor, Slot, Appointment, ChatMessage, OTP, UserProfile, MedicalRecord
from .serializers import (
    UserSerializer, SpecializationSerializer, DoctorSerializer, 
    SlotSerializer, AppointmentSerializer, ChatMessageSerializer, MedicalRecordSerializer
)

class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        
        if profile and profile.is_doctor:
            # Doctors can see records they uploaded OR all records if we want, 
            # but user said "upload report of their patients". 
            # Let's show records uploaded by this doctor.
            return MedicalRecord.objects.filter(doctor=profile.doctor).order_by('-uploaded_at')
        else:
            # Patients see only their own records
            return MedicalRecord.objects.filter(patient=user).order_by('-uploaded_at')

    def create(self, request, *args, **kwargs):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Response({'error': 'Only doctors can upload reports.'}, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        profile = self.request.user.profile
        serializer.save(doctor=profile.doctor)

class PatientListView(viewsets.ViewSet):
    """Returns a list of unique patients who have appointments with the logged-in doctor."""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Get all appointments for this doctor and extract unique patients
        appointments = Appointment.objects.filter(doctor=profile.doctor).select_related('user')
        patients = {}
        for appt in appointments:
            u = appt.user
            patients[u.id] = {
                'id': u.id,
                'username': u.username,
                'name': u.first_name or u.username
            }
        
        return Response(list(patients.values()))

class SpecializationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [permissions.AllowAny]

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    
    def get_queryset(self):
        return Appointment.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        doctor = serializer.validated_data['doctor']
        slot = serializer.validated_data['slot']
        appointment_date = serializer.validated_data['appointment_date']
        user = request.user

        # Prevent multiple active appointments with the same doctor
        active_appointment = Appointment.objects.filter(
            user=user, 
            doctor=doctor, 
            status__in=['Upcoming', 'Accepted', 'Booked']
        ).first()
        
        if active_appointment:
            return Response(
                {"error": f"You already have an active appointment with this doctor (Date: {active_appointment.appointment_date}). Please complete or cancel it before booking again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Appointment.objects.filter(doctor=doctor, slot=slot, appointment_date=appointment_date).exists():
            return Response(
                {"error": "This time slot is already booked for this date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def make_payment(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status != 'Accepted':
            return Response({'error': 'Only approved appointments can be paid for.'}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.status = 'Booked'
        appointment.save()
        return Response({'message': 'Payment successful. Your appointment is now Booked.', 'status': 'Booked'})

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ChatBotViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    
    def get_queryset(self):
        return ChatMessage.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        message = request.data.get('message')
        response_text = f"I understand you're asking about '{message}'. As a virtual assistant, I recommend booking an appointment with one of our specialists for a detailed diagnosis."
        if 'headache' in message.lower():
            response_text = "For headaches, it's best to consult a General Physician or a Neurologist. Ensure you're staying hydrated."
        
        chat = ChatMessage.objects.create(
            user=request.user,
            message=message,
            response=response_text
        )
        serializer = self.get_serializer(chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class RegisterView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    def create(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        mobile = request.data.get('mobile')
        
        if not username or not password or not mobile:
            return Response({'error': 'Username, Password and Mobile are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists() or UserProfile.objects.filter(mobile=mobile).exists():
            return Response({'error': 'Username or Mobile number already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(username=username, password=password)
        user.first_name = username
        user.save()
        
        UserProfile.objects.create(user=user, mobile=mobile, is_doctor=False)
        
        return Response({'message': 'Account created successfully'}, status=status.HTTP_201_CREATED)


class DoctorRegisterView(viewsets.ViewSet):
    """Self-registration for doctors. Can link to an existing unlinked Doctor record or create a new one."""
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        doctor_id = request.data.get('doctor_id')
        name = request.data.get('name')
        specialization_id = request.data.get('specialization_id')

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        if doctor_id:
            try:
                doctor = Doctor.objects.get(id=doctor_id)
            except Doctor.DoesNotExist:
                return Response({'error': 'Doctor record not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            if hasattr(doctor, 'user_profile'):
                return Response({'error': 'This doctor already has an account.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            if not name or not specialization_id:
                return Response({'error': 'Name and Specialization are required to create a new doctor profile.'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                spec = Specialization.objects.get(id=specialization_id)
            except Specialization.DoesNotExist:
                return Response({'error': 'Specialization not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            doctor = Doctor.objects.create(
                name=name,
                specialization=spec,
                experience=0,
                rating=5.0,
                reviews_count=0,
                location="Not specified",
                image_url=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=10B981&color=fff"
            )

        user = User.objects.create_user(username=username, password=password, first_name=doctor.name)
        profile = UserProfile.objects.create(user=user, is_doctor=True, doctor=doctor)

        # Auto-login: return tokens so frontend logs in immediately
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': f'Doctor account created for {doctor.name}.',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'username': user.username,
                'name': user.first_name,
                'role': 'doctor',
                'doctor_id': doctor.id,
            }
        }, status=status.HTTP_201_CREATED)


class UnlinkedDoctorsView(viewsets.ViewSet):
    """List Doctor records that do not yet have a user account — for the signup dropdown."""
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        # Doctors that have no related user_profile
        unlinked = Doctor.objects.filter(user_profile__isnull=True)
        data = [{
            'id': d.id,
            'name': d.name,
            'specialization': d.specialization.name,
            'location': d.location,
        } for d in unlinked]
        return Response(data)


class DoctorProfileView(viewsets.ViewSet):
    """Authenticated doctor can view and update their Doctor record."""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Response({'error': 'Not a doctor account.'}, status=status.HTTP_403_FORBIDDEN)
        from .serializers import DoctorSerializer
        serializer = DoctorSerializer(profile.doctor)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'post', 'put'])
    def update_info(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Response({'error': 'Not a doctor account.'}, status=status.HTTP_403_FORBIDDEN)

        doctor = profile.doctor
        updatable = ['experience', 'about', 'availability_time', 'location', 'image_url', 'name']
        for field in updatable:
            val = request.data.get(field)
            if val is not None:
                setattr(doctor, field, val)
        
        # Sync name to user first_name if updated
        if 'name' in request.data:
            user = request.user
            user.first_name = request.data['name']
            user.save()

        # Handle specialization update
        spec_id = request.data.get('specialization')
        if spec_id:
            try:
                from .models import Specialization
                spec = Specialization.objects.get(id=spec_id)
                doctor.specialization = spec
            except Specialization.DoesNotExist:
                pass

        doctor.save()

        from .serializers import DoctorSerializer
        return Response(DoctorSerializer(doctor).data)


class DoctorAppointmentView(viewsets.ViewSet):
    """Doctors view and manage their own appointments."""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Response({'error': 'Access denied. Not a doctor account.'}, status=status.HTTP_403_FORBIDDEN)

        appointments = Appointment.objects.filter(doctor=profile.doctor).order_by('-created_at')
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            appointment = Appointment.objects.get(pk=pk, doctor=profile.doctor)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Allow updating date, problem, and slot
        new_date = request.data.get('appointment_date')
        new_problem = request.data.get('problem')
        new_slot_id = request.data.get('slot')

        if new_date:
            appointment.appointment_date = new_date
        if new_problem:
            appointment.problem = new_problem
        
        if new_slot_id:
            try:
                from .models import Slot
                new_slot = Slot.objects.get(id=new_slot_id, doctor=profile.doctor)
                
                # If changing slots, free the old one and book the new one
                if appointment.slot != new_slot:
                    old_slot = appointment.slot
                    old_slot.is_booked = False
                    old_slot.save()
                    
                    new_slot.is_booked = True
                    new_slot.save()
                    appointment.slot = new_slot
            except Slot.DoesNotExist:
                return Response({'error': 'Invalid slot.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.save()
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        valid = ['Accepted', 'Rejected', 'Completed']
        if new_status not in valid:
            return Response({'error': f'Status must be one of: {valid}'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(pk=pk, doctor=profile.doctor)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        appointment.status = new_status
        appointment.save()
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)


class DoctorSlotViewSet(viewsets.ModelViewSet):
    """Doctors manage their own time slots."""
    serializer_class = SlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            return Slot.objects.none()
        return Slot.objects.filter(doctor=profile.doctor)

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
            raise permissions.exceptions.PermissionDenied("Only doctors can create slots.")
        serializer.save(doctor=profile.doctor)
        
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_doctor or not profile.doctor:
             return Response({'error': 'Denied'}, status=status.HTTP_403_FORBIDDEN)
        
        slots_data = request.data.get('slots', [])
        created_slots = []
        for s in slots_data:
            time = s.get('time')
            shift = s.get('shift', 'Morning')
            if time:
                slot = Slot.objects.create(doctor=profile.doctor, time=time, shift=shift)
                created_slots.append(SlotSerializer(slot).data)
        
        return Response(created_slots, status=status.HTTP_201_CREATED)


class OTPViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def send_otp(self, request):
        mobile = request.data.get('mobile')
        if not mobile:
            return Response({'error': 'Mobile number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        otp_code = str(random.randint(1000, 9999))
        OTP.objects.update_or_create(mobile=mobile, defaults={'code': otp_code})
        print(f"OTP for {mobile}: {otp_code}")
        
        return Response({'message': 'OTP sent successfully', 'otp': otp_code}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        mobile = request.data.get('mobile')
        code = request.data.get('code')
        name = request.data.get('name')
        password = request.data.get('password')
        
        if not mobile or not code:
            return Response({'error': 'Mobile and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            otp_obj = OTP.objects.get(mobile=mobile, code=code)
            
            # Find user by mobile in profile or username
            profile = UserProfile.objects.filter(mobile=mobile).first()
            user = profile.user if profile else User.objects.filter(username=mobile).first()
            
            if not user:
                if not name:
                    name = f"User {mobile[-4:]}"
                user = User.objects.create_user(
                    username=mobile, 
                    first_name=name,
                    password=password if password else User.objects.make_random_password()
                )
                profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'mobile': mobile})
            elif not profile:
                 profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'mobile': mobile})
            
            if name:
                user.first_name = name
                user.save()

            refresh = RefreshToken.for_user(user)
            otp_obj.delete()
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'username': user.username,
                    'name': user.first_name,
                    'role': 'doctor' if profile.is_doctor else 'patient',
                    'doctor_id': profile.doctor.id if profile.doctor else None,
                },
                'message': 'Verification successful'
            }, status=status.HTTP_200_OK)
            
        except OTP.DoesNotExist:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

class UnifiedLoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        identifier = request.data.get('username') or request.data.get('mobile')
        password = request.data.get('password')
        
        if not identifier or not password:
            return Response({'error': 'Credentials required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Search by username, email, or mobile in profile
        user = User.objects.filter(models.Q(username=identifier) | models.Q(email=identifier)).first()
        if not user:
            profile = UserProfile.objects.filter(mobile=identifier).first()
            if profile:
                user = profile.user
        
        if user and user.check_password(password):
            profile, _ = UserProfile.objects.get_or_create(user=user)
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'username': user.username,
                    'name': user.first_name or user.username,
                    'role': 'doctor' if profile.is_doctor else 'patient',
                    'doctor_id': profile.doctor.id if profile.doctor else None,
                },
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
            
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        return Response({
            'username': user.username,
            'name': user.first_name or user.username,
            'email': user.email or f"{user.username.lower()}@healthsync.io",
            'mobile': profile.mobile or "Not Configured",
            'location': profile.location or 'New Delhi, Sector 24, IN',
            'profile_photo': profile.profile_photo if profile.profile_photo else f'https://ui-avatars.com/api/?name={user.first_name or user.username}&background=46C2DE&color=fff',
            'role': 'doctor' if profile.is_doctor else 'patient',
            'doctor_id': profile.doctor.id if profile.doctor else None,
        })

    @action(detail=False, methods=['post', 'put', 'patch'])
    def update_profile(self, request):
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        name = request.data.get('name')
        mobile = request.data.get('mobile')
        location = request.data.get('location')
        profile_photo = request.data.get('profile_photo')
        
        if name:
            user.first_name = name
            user.save()
            # Sync to doctor record if exists
            if profile.is_doctor and profile.doctor:
                profile.doctor.name = name
                profile.doctor.save()
            
        if mobile:
            profile.mobile = mobile
        if location:
            profile.location = location
        if profile_photo:
            profile.profile_photo = profile_photo
            
        profile.save()
            
        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'name': user.first_name,
                'mobile': profile.mobile,
                'location': profile.location,
                'profile_photo': profile.profile_photo
            }
        })
