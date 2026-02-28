# BookAppoiment - Health Care Management System

A comprehensive web application for managing doctor appointments, patient profiles, and medical shifts. This project is built using a modern decoupled architecture with a Django backend and a Next.js frontend.

## 🚀 Features

- **Doctor Appointment Booking**: Real-time scheduling for patients.
- **Role-Based Access**: Specialized interfaces for Doctors, Patients, and Staff.
- **Shift Management**: Doctors can manage their availability and slots.
- **Medical Records**: Track patient history and appointment outcomes.
- **Authentication**: Secure login/signup system.

## 📁 Project Structure

```text
BookAppoiment/
├── backend/    # Django REST Framework API
└── frontend/   # Next.js (React) Web Application
```

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 
- **API**: Django REST Framework (DRF)
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Auth**: Token-based Authentication

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Material UI (MUI), Bootstrap, Framer Motion
- **HTTP Client**: Axios
- **State/Logic**: React Hooks & Context API

## 🚦 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.

## 📜 License
This project is for demonstration and healthcare management purposes.
