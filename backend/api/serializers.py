from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Specialization, Doctor, Slot, Appointment, ChatMessage, MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    doctor_name = serializers.ReadOnlyField(source='doctor.name')
    patient_username = serializers.ReadOnlyField(source='patient.username')
    patient_full_name = serializers.ReadOnlyField(source='patient.first_name')
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['doctor']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = '__all__'

class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ['id', 'time', 'is_booked', 'shift']

class DoctorSerializer(serializers.ModelSerializer):
    specialization_name = serializers.ReadOnlyField(source='specialization.name')
    slots = SlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.ReadOnlyField(source='doctor.name')
    specialization_name = serializers.ReadOnlyField(source='doctor.specialization.name')
    slot_time = serializers.ReadOnlyField(source='slot.time')
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['user']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
