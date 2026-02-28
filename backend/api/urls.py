from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorViewSet, AppointmentViewSet, ChatBotViewSet, RegisterView,
    OTPViewSet, UnifiedLoginView, ProfileView,
    DoctorRegisterView, DoctorAppointmentView,
    UnlinkedDoctorsView, DoctorProfileView, SpecializationViewSet, DoctorSlotViewSet,
    MedicalRecordViewSet, PatientListView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet)
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'chat', ChatBotViewSet, basename='chat')
router.register(r'auth', OTPViewSet, basename='auth')
router.register(r'profile', ProfileView, basename='profile')
router.register(r'doctor-appointments', DoctorAppointmentView, basename='doctor-appointment')
router.register(r'specializations', SpecializationViewSet)
router.register(r'unlinked-doctors', UnlinkedDoctorsView, basename='unlinked-doctors')
router.register(r'doctor-profile', DoctorProfileView, basename='doctor-profile')
router.register(r'doctor-slots', DoctorSlotViewSet, basename='doctor-slots')
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-records')
router.register(r'doctor-patients', PatientListView, basename='doctor-patients')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view({'post': 'create'}), name='register'),
    path('doctor-register/', DoctorRegisterView.as_view({'post': 'create'}), name='doctor-register'),
    path('token/', UnifiedLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
