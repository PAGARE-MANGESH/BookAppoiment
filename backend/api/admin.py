from django.contrib import admin
from .models import Specialization, Doctor, Slot, Appointment, UserProfile, ChatMessage, OTP, MedicalRecord

admin.site.register(Specialization)
admin.site.register(Doctor)
admin.site.register(Slot)
admin.site.register(Appointment)
admin.site.register(UserProfile)
admin.site.register(ChatMessage)
admin.site.register(OTP)
admin.site.register(MedicalRecord)
