from django.db import models
from django.contrib.auth.models import User

class Specialization(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class Doctor(models.Model):
    name = models.CharField(max_length=100)
    specialization = models.ForeignKey(Specialization, on_delete=models.CASCADE, related_name='doctors')
    experience = models.IntegerField(default=0)
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    about = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True) # Using URL for demo ease
    availability_time = models.CharField(max_length=100, default="10 AM - 5 PM")
    location = models.CharField(max_length=200, default="Mumbai, India")

    def __str__(self):
        return self.name

class Slot(models.Model):
    SHIFT_CHOICES = [
        ('Morning', 'Morning'),
        ('Afternoon', 'Afternoon'),
        ('Evening', 'Evening'),
    ]
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='slots')
    time = models.CharField(max_length=20) # e.g. "09:30 AM"
    is_booked = models.BooleanField(default=False)
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, default='Morning')

    def __str__(self):
        return f"{self.doctor.name} - {self.time}"

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('Upcoming', 'Upcoming'),
        ('Accepted', 'Accepted'),
        ('Booked', 'Booked'),
        ('Completed', 'Completed'),
        ('Canceled', 'Canceled'),
        ('Rejected', 'Rejected'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    slot = models.ForeignKey(Slot, on_delete=models.CASCADE)
    appointment_date = models.DateField()
    patient_name = models.CharField(max_length=100)
    patient_age = models.IntegerField()
    patient_gender = models.CharField(max_length=10)
    problem = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Upcoming')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_name} - {self.doctor.name}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    mobile = models.CharField(max_length=15, blank=True)
    location = models.CharField(max_length=255, blank=True)
    profile_photo = models.TextField(blank=True)  # Storing as base64 for demo simplicity
    is_doctor = models.BooleanField(default=False)
    doctor = models.OneToOneField('Doctor', on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profile')

    def __str__(self):
        return f"Profile for {self.user.username}"

class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class OTP(models.Model):
    mobile = models.CharField(max_length=15, unique=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mobile} - {self.code}"
class MedicalRecord(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='uploaded_records')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100) # e.g. Laboratory, Imaging, Prescription
    file_size = models.CharField(max_length=50) # e.g. "2.4 MB"
    file_data = models.TextField() # Base64 for demo
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} for {self.patient.username}"
