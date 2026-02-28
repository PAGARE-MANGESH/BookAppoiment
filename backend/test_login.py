import os
import django
from django.contrib.auth.models import User
from django.db.models import Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_login(identifier, password):
    user = User.objects.filter(Q(username=identifier) | Q(email=identifier)).first()
    if user:
        print(f"User found: {user.username}")
        if user.check_password(password):
            print("Password match!")
        else:
            print("Password mismatch.")
    else:
        print("User not found.")

print("Testing with testuser...")
test_login('testuser', 'password123')

# List some users
print("\nRecent users:")
for u in User.objects.all().order_by('-id')[:5]:
    print(f"Username: {u.username}, Email: {u.email}")
