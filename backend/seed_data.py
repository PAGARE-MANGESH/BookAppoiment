import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Specialization, Doctor, Slot
from django.contrib.auth.models import User

def seed():
    # Create Specializations
    specs = ['Cardiologist', 'Psychologist', 'Neurologist', 'General Physician', 'Dermatologist']
    spec_objs = {}
    for name in specs:
        obj, _ = Specialization.objects.get_or_create(name=name)
        spec_objs[name] = obj

    # Create Doctors
    doctors_data = [
        {
            'name': 'Dr. Prakash Das',
            'spec': 'Psychologist',
            'exp': 11,
            'rating': 4.8,
            'reviews': 4942,
            'about': '11+ years of experience in all aspects of psychology...',
            'image': 'https://img.freepik.com/free-photo/smiling-doctor-with-stethoscope-isolated-on-white_231208-11234.jpg'
        },
        {
            'name': 'Dr. Kumar Das',
            'spec': 'Cardiologist',
            'exp': 15,
            'rating': 4.9,
            'reviews': 5000,
            'about': '15+ years of experience in Cardiology...',
            'image': 'https://img.freepik.com/free-photo/doctor-offering-medical-teleconsultation_23-2149329007.jpg'
        },
        {
            'name': 'Dr. Divya Das',
            'spec': 'Neurologist',
            'exp': 8,
            'rating': 4.7,
            'reviews': 3200,
            'about': 'Specialist in neurological disorders...',
            'image': 'https://img.freepik.com/free-photo/female-doctor-hospital_23-2148825940.jpg'
        }
    ]

    for data in doctors_data:
        doc, created = Doctor.objects.get_or_create(
            name=data['name'],
            defaults={
                'specialization': spec_objs[data['spec']],
                'experience': data['exp'],
                'rating': data['rating'],
                'reviews_count': data['reviews'],
                'about': data['about'],
                'image_url': data['image']
            }
        )
        # Add slots
        times = ['09:30 AM', '10:30 AM', '11:30 AM', '12:30 PM', '01:30 PM', '02:30 PM']
        for t in times:
            Slot.objects.get_or_create(doctor=doc, time=t)

    # Create a test user
    if not User.objects.filter(username='testuser').exists():
        User.objects.create_user(username='testuser', password='password123', email='test@example.com')

    print("Database seeded successfully!")

if __name__ == '__main__':
    seed()
