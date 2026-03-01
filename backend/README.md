# BookAppoiment - Backend API

This is the Django-based backend server for the BookAppoiment system.

## 🛠️ Technology
- **Django**: Core web framework.
- **Django REST Framework**: For building the API.
- **Authentication**: Standard Django auth and Token-based services.
- **CORS Headers**: Configured to interact with the Next.js frontend.

## 🏗️ Setup & Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install django djangorestframework django-cors-headers
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the server:
   ```bash
   python manage.py runserver
   ```

## 📍 API Endpoints
- `/admin/`: Django Admin interface.
- `/api/`: Root for all REST endpoints (Doctors, Slots, Appointments, etc.).

## 🔐 Environment Variables
Make sure to configure your `SECRET_KEY` and `DEBUG` settings in `core/settings.py` before deploying to production.
