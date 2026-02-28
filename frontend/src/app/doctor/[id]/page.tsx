"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AxiosInstance from "@/lib/AxiosInstance";
import {
    ArrowLeft, Star, Users, Briefcase, Calendar, Clock,
    MessageSquare, CheckCircle, Share2, Heart, Info,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";
import LoadingOverlay from "../../../components/LoadingOverlay";
import { showConfirm, showSuccess, showError } from "@/lib/alerts";

// Date-fns imports for calendar logic
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isBefore,
    startOfDay
} from "date-fns";

interface Slot {
    id: number;
    time: string;
    shift: "Morning" | "Afternoon" | "Evening";
    is_booked: boolean;
}

interface Doctor {
    id: number;
    name: string;
    specialization_name: string;
    experience: number;
    rating: number;
    reviews_count: number;
    about: string;
    image_url: string;
    availability_time: string;
    slots: Slot[];
}

export default function DoctorDetails() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    // State
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [booked, setBooked] = useState(false);
    const [existingAppointment, setExistingAppointment] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const formattedDate = format(selectedDate, 'yyyy-MM-dd');

                const [docRes, apptsRes] = await Promise.all([
                    AxiosInstance.get(`doctors/${id}/`),
                    AxiosInstance.get('appointments/')
                ]);

                setDoctor(docRes.data);

                // Check for existing appointment with this doctor that is NOT completed/canceled/rejected
                // User said: "not select another appoimrt before rejct and approve"
                // Usually this means if they have a pending request or an approved one (waiting for payment), or even booked.
                const activeAppointment = apptsRes.data.find((a: any) =>
                    a.doctor === parseInt(id) &&
                    ['Upcoming', 'Accepted', 'Booked'].includes(a.status)
                );

                setExistingAppointment(activeAppointment);

                // Reset selected slot when date changes
                setSelectedSlot(null);
                setBooked(false);

            } catch (err) {
                console.error(err);
                showError("Could not load details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, selectedDate]);

    // --- Booking Logic ---
    const handleBook = async () => {
        if (!selectedSlot || !id) {
            showError("Please select a time slot first.");
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            showError("Your session has expired. Please log in again.");
            router.push('/');
            return;
        }

        const result = await showConfirm(
            'Confirm Appointment Request?',
            `Request an appointment for ${format(selectedDate, 'MMMM do, yyyy')} with Dr. ${doctor?.name}?`
        );

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const payload = {
                doctor: parseInt(id),
                slot: selectedSlot,
                appointment_date: format(selectedDate, 'yyyy-MM-dd'),
                patient_name: localStorage.getItem('user_name') || "Patient",
                patient_age: 24,
                patient_gender: "Other", // Fixed: Max 10 chars
                problem: "General Consultation / Checkup"
            };

            await AxiosInstance.post('appointments/', payload);

            // Mock notification trigger
            const mockNotif = {
                id: Date.now(),
                type: 'booking_request',
                message: `Booking request sent to Dr. ${doctor?.name}`,
                time: new Date().toISOString()
            };
            const existingNotifs = JSON.parse(localStorage.getItem('user_notifications') || '[]');
            localStorage.setItem('user_notifications', JSON.stringify([mockNotif, ...existingNotifs]));

            setBooked(true);
            showSuccess("Success! Your request has been sent for approval.");
            setTimeout(() => router.push('/bookings'), 2000);
        } catch (err: any) {
            console.error("Booking error:", err.response?.data || err);
            const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Unable to process booking request.";
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // --- Calendar Helper Functions ---
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="d-flex align-items-center justify-content-between mb-4">
                <span className="fw-bold text-dark outfit fs-5">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <div className="d-flex gap-2">
                    <button onClick={prevMonth} className="btn btn-light btn-sm rounded-circle p-2 border shadow-sm">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextMonth} className="btn btn-light btn-sm rounded-circle p-2 border shadow-sm">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="row g-0 mb-2">
                {days.map(day => (
                    <div className="col text-center text-muted uppercase fw-bold" style={{ fontSize: '10px' }} key={day}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const today = startOfDay(new Date());

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isPast = isBefore(day, today);

                days.push(
                    <div className="col p-1" key={day.toString()}>
                        <button
                            disabled={isPast}
                            onClick={() => setSelectedDate(cloneDay)}
                            className={`
                                w-100 d-flex flex-column align-items-center justify-content-center rounded-3 border transition-all py-2
                                ${!isCurrentMonth ? 'text-muted opacity-25 bg-light border-0' : ''}
                                ${isSelected
                                    ? 'bg-primary text-white border-primary shadow-md transform-scale'
                                    : isPast
                                        ? 'bg-light text-muted border-light-subtle cursor-not-allowed'
                                        : 'bg-white text-dark border-light-subtle hover-bg-light'}
                            `}
                            style={{ height: '50px' }}
                        >
                            <span className={`fw-bold small ${isSelected ? 'text-white' : 'text-dark'}`}>
                                {format(day, 'd')}
                            </span>
                        </button>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="row g-0" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="calendar-grid">{rows}</div>;
    };

    if (!doctor && !loading) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center flex-column gap-3">
            <h3 className="fw-bold text-dark">Doctor not found</h3>
            <button onClick={() => router.push('/home')} className="btn btn-primary rounded-pill px-4">Back to Dashboard</button>
        </div>
    );

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>
                {loading && <LoadingOverlay />}
            </AnimatePresence>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="Book Appointment" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 overflow-y-auto">
                    {!doctor ? null : (
                        <div className="row g-4">
                            {/* LEFT: Doctor Profile Information */}
                            <div className="col-12 col-xl-5">
                                <div className="d-flex flex-column gap-4">
                                    <div className="glass-container p-0 overflow-hidden border-0 shadow-premium-lg mb-4">
                                        <div className="p-4" style={{ background: 'linear-gradient(135deg, #46C2DE 0%, #37AECB 100%)' }}>
                                            <div className="d-flex align-items-center gap-3">
                                                <button onClick={() => router.back()} className="btn btn-white btn-sm rounded-circle p-2 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                                                    <ArrowLeft size={18} className="text-white" />
                                                </button>
                                                <h5 className="fw-bold m-0 text-white outfit uppercase tracking-wider" style={{ fontSize: '1rem' }}>Doctor Profile</h5>
                                            </div>
                                        </div>

                                        <div className="px-4 pb-4" style={{ marginTop: '-24px' }}>
                                            <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-4 p-4 shadow-sm border border-light-subtle">
                                                <div className="d-flex align-items-start justify-content-between mb-4">
                                                    <div className="d-flex gap-3 align-items-center">
                                                        <div className="rounded-4 overflow-hidden shadow-md border-2 border-white position-relative" style={{ width: '92px', height: '92px' }}>
                                                            {doctor.image_url ? (
                                                                <Image
                                                                    src={doctor.image_url}
                                                                    alt={doctor.name}
                                                                    fill
                                                                    unoptimized
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-100 h-100 bg-primary-soft text-primary d-flex align-items-center justify-content-center outfit fw-bold fs-4">
                                                                    {doctor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="fw-bold text-dark outfit mb-1">{doctor.name}</h4>
                                                            <span className="text-primary fw-bold small d-block mb-1">{doctor.specialization_name}</span>
                                                            <div className="d-flex align-items-center gap-2 text-muted smallest fw-bold uppercase">
                                                                <Star size={12} className="text-warning fill-warning" />
                                                                <span>{doctor.rating} ({doctor.reviews_count} Reviews)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button className="btn btn-light rounded-circle p-2 border-0 shadow-xs"><Share2 size={16} className="text-muted" /></button>
                                                        <button className="btn btn-light rounded-circle p-2 border-0 shadow-xs"><Heart size={16} className="text-muted" /></button>
                                                    </div>
                                                </div>

                                                <div className="row g-2 pt-3 border-top">
                                                    {[
                                                        { icon: Users, label: 'Patients', value: '5k+', bg: 'rgba(70, 194, 222, 0.1)' },
                                                        { icon: Briefcase, label: 'Exp.', value: `${doctor.experience}+ Yrs`, bg: 'rgba(70, 194, 222, 0.1)' },
                                                        { icon: Star, label: 'Rating', value: doctor.rating, bg: 'rgba(255, 193, 7, 0.1)' },
                                                        { icon: MessageSquare, label: 'Reviews', value: doctor.reviews_count, bg: 'rgba(139, 92, 246, 0.1)' },
                                                    ].map((stat, i) => (
                                                        <div key={i} className="col-3 text-center">
                                                            <div className="rounded-3 d-flex align-items-center justify-content-center mx-auto mb-2"
                                                                style={{ width: '44px', height: '44px', backgroundColor: stat.bg }}>
                                                                <stat.icon size={20} className="text-dark opacity-75" />
                                                            </div>
                                                            <div className="fw-bold text-dark smallest mb-0">{stat.value}</div>
                                                            <div className="text-muted" style={{ fontSize: '9px', fontWeight: 600 }}>{stat.label.toUpperCase()}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-container p-4 border-0 shadow-premium mb-4">
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-dark outfit mb-3 d-flex align-items-center gap-2">
                                                <Info size={18} className="text-primary" /> Specialist Insight
                                            </h6>
                                            <p className="text-muted small lh-lg mb-0 text-justify">
                                                {doctor.about || "Distinguished medical professional specializing in comprehensive patient care. Known for clinical excellence and personalized treatment strategies tailored to individual health needs."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="glass-container p-4 border-0 shadow-premium">
                                        <h6 className="fw-bold text-dark outfit mb-3 d-flex align-items-center gap-2">
                                            <Calendar size={18} className="text-primary" /> Practice Hours
                                        </h6>
                                        <div className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-primary-soft border border-primary border-opacity-10">
                                            <div className="d-flex align-items-center gap-3">
                                                <Clock size={18} className="text-primary" />
                                                <span className="text-dark fw-bold small">Mon — Fri</span>
                                            </div>
                                            <span className="text-primary fw-bold small">{doctor.availability_time || "10:00 AM — 05:00 PM"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Scheduling & Slots */}
                            <div className="col-12 col-xl-7">
                                <div className="glass-container p-0 border-0 shadow-sm h-100 d-flex flex-column">
                                    <div className="p-4 border-bottom bg-white sticky-top rounded-top" style={{ zIndex: 10 }}>
                                        <h6 className="fw-bold m-0 text-dark outfit d-flex align-items-center gap-2">
                                            <Calendar size={20} className="text-primary" />
                                            Scheduling Details
                                        </h6>
                                    </div>

                                    <div className="p-4 flex-grow-1">
                                        {/* REAL CALENDAR */}
                                        <div className="mb-5 bg-light bg-opacity-25 p-3 rounded-4 border border-light-subtle shadow-sm">
                                            {renderHeader()}
                                            {renderDays()}
                                            {renderCells()}
                                        </div>

                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h6 className="fw-bold text-dark m-0 outfit">Available Slots</h6>
                                            <span className="badge bg-primary-soft text-primary fw-bold px-3 py-2 rounded-pill">
                                                {format(selectedDate, 'EEEE, MMMM do')}
                                            </span>
                                        </div>

                                        <div className="row g-4">
                                            {(['Morning', 'Afternoon', 'Evening'] as const).map((shiftType) => {
                                                const shiftSlots = doctor.slots.filter(s => s.shift === shiftType);
                                                if (shiftSlots.length === 0 && shiftType === 'Evening') return null;

                                                return (
                                                    <div key={shiftType} className="col-12 col-md-6">
                                                        <h6 className="fw-bold text-dark outfit mb-3 small d-flex align-items-center gap-2">
                                                            <Clock size={16} className={shiftType === 'Morning' ? 'text-warning' : shiftType === 'Afternoon' ? 'text-success' : 'text-primary'} />
                                                            {shiftType} Slots
                                                        </h6>
                                                        <div className="row g-2">
                                                            {shiftSlots.length > 0 ? (
                                                                shiftSlots.map((slot) => (
                                                                    <div key={slot.id} className="col-6">
                                                                        <button
                                                                            onClick={() => setSelectedSlot(slot.id)}
                                                                            disabled={slot.is_booked || !!existingAppointment}
                                                                            className={`btn w-100 py-3 rounded-4 border small fw-bold transition-all ${selectedSlot === slot.id
                                                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                                                : slot.is_booked ? 'bg-light text-muted border-light text-decoration-line-through cursor-not-allowed' : 'bg-white text-dark border-light-subtle hover-bg-light shadow-xs'
                                                                                }`}
                                                                        >
                                                                            {slot.time}
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="col-12 text-muted small ps-3 fst-italic">No {shiftType.toLowerCase()} slots available</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Booking Confirmation Summary */}
                                    <div className="p-4 bg-light border-top mt-auto rounded-bottom shadow-inner">
                                        <div className="row align-items-center">
                                            <div className="col-md-6 mb-3 mb-md-0">
                                                <div className="d-flex gap-3 align-items-center">
                                                    <div className="bg-white p-3 rounded-4 shadow-sm border w-100">
                                                        <div className="text-muted uppercase fw-bold" style={{ fontSize: '9px' }}>SELECTED SESSION</div>
                                                        <div className="text-dark fw-bold fs-6">
                                                            {selectedSlot
                                                                ? `${format(selectedDate, 'MMM dd')}, ${doctor.slots.find(s => s.id === selectedSlot)?.time}`
                                                                : (existingAppointment ? "Pending Active Session" : "Choose Date & Time")}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 text-end">
                                                <button
                                                    onClick={handleBook}
                                                    disabled={!selectedSlot || booked || !!existingAppointment}
                                                    className="btn btn-premium w-100 py-3 rounded-4 fw-bold shadow-md d-flex align-items-center justify-content-center gap-2 transition-all hover-scale"
                                                    style={{
                                                        backgroundColor: (booked || existingAppointment) ? '#10B981' : undefined,
                                                        border: 'none',
                                                        fontSize: '1rem',
                                                        cursor: (booked || existingAppointment) ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {existingAppointment ? (
                                                        <><CheckCircle size={20} /> Request Already Active</>
                                                    ) : booked ? (
                                                        <><CheckCircle size={20} /> Request Sent</>
                                                    ) : (
                                                        <><Calendar size={20} /> Schedule Appointment Now</>
                                                    )}
                                                </button>
                                                {existingAppointment && (
                                                    <p className="smallest text-muted mt-2 fw-medium">Complete or cancel your current request with this doctor first.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <style jsx>{`
                .scroll-hide::-webkit-scrollbar { display: none; }
                .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .hover-bg-light:hover { background: #f8fafc !important; }
                .transform-scale:active { transform: scale(0.95); }
                .hover-scale:hover { transform: scale(1.02); }
                .bg-primary-soft { background: rgba(70, 194, 222, 0.1); }
                .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .cursor-not-allowed { cursor: not-allowed; }
            `}</style>
        </div>
    );
}
///



// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import AxiosInstance from "@/lib/AxiosInstance";
// import {
//     ArrowLeft, Star, Users, Briefcase, Calendar, Clock,
//     MessageSquare, CheckCircle, Share2, Heart, Info,
//     ChevronLeft, ChevronRight
// } from "lucide-react";
// import { AnimatePresence } from "framer-motion";
// import Image from "next/image";
// import Sidebar from "@/components/Sidebar";
// import TacticalHeader from "@/components/TacticalHeader";
// import LoadingOverlay from "../../../components/LoadingOverlay";
// import { showConfirm, showSuccess, showError } from "@/lib/alerts";

// // Date-fns imports for calendar logic
// import {
//     format,
//     addMonths,
//     subMonths,
//     startOfMonth,
//     endOfMonth,
//     startOfWeek,
//     endOfWeek,
//     isSameMonth,
//     isSameDay,
//     addDays,
//     isBefore,
//     startOfDay
// } from "date-fns";

// interface Slot {
//     id: number;
//     time: string;
//     is_booked: boolean;
// }

// interface Doctor {
//     id: number;
//     name: string;
//     specialization_name: string;
//     experience: number;
//     rating: number;
//     reviews_count: number;
//     about: string;
//     image_url: string;
//     availability_time: string;
//     slots: Slot[];
// }

// export default function DoctorDetails() {
//     const params = useParams();
//     const id = params?.id as string;
//     const router = useRouter();

//     // State
//     const [doctor, setDoctor] = useState<Doctor | null>(null);
//     const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

//     // Calendar State
//     const [currentMonth, setCurrentMonth] = useState(new Date());
//     const [selectedDate, setSelectedDate] = useState(new Date());

//     const [loading, setLoading] = useState(true);
//     const [booked, setBooked] = useState(false);
//     const [existingAppointment, setExistingAppointment] = useState<any>(null);
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//     // --- Fetch Data ---
//     useEffect(() => {
//         const fetchData = async () => {
//             setLoading(true);
//             try {
//                 // Format date as YYYY-MM-DD for backend
//                 const formattedDate = format(selectedDate, 'yyyy-MM-dd');

//                 const [docRes, apptsRes] = await Promise.all([
//                     // Assuming your backend accepts a ?date= query param to filter slots
//                     AxiosInstance.get(`doctors/${id}/?date=${formattedDate}`),
//                     AxiosInstance.get('appointments/')
//                 ]);

//                 // If backend doesn't filter slots by date automatically,
//                 // you might need to filter docRes.data.slots here based on your API structure.
//                 setDoctor(docRes.data);

//                 // Check for existing appointment
//                 const existing = apptsRes.data.find((a: any) =>
//                     a.doctor === parseInt(id) && a.appointment_date === formattedDate
//                 );
//                 setExistingAppointment(existing);

//                 // Reset selected slot when date changes
//                 setSelectedSlot(null);
//                 setBooked(false);

//             } catch (err) {
//                 console.error(err);
//                 showError("Could not load details.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (id) fetchData();
//     }, [id, selectedDate]);

//     // --- Booking Logic ---
//     const handleBook = async () => {
//         if (!selectedSlot || !id) {
//             showError("Please select a time slot first.");
//             return;
//         }

//         const token = localStorage.getItem('access_token');
//         if (!token) {
//             showError("Your session has expired. Please log in again.");
//             router.push('/');
//             return;
//         }

//         const result = await showConfirm(
//             'Confirm Appointment?',
//             `Book appointment for ${format(selectedDate, 'MMMM do, yyyy')}?`
//         );

//         if (!result.isConfirmed) return;

//         setLoading(true);
//         try {
//             const payload = {
//                 doctor: parseInt(id),
//                 slot: selectedSlot,
//                 appointment_date: format(selectedDate, 'yyyy-MM-dd'),
//                 patient_name: "Priya Sharma",
//                 patient_age: 24,
//                 patient_gender: "Female",
//                 problem: "General Consultation"
//             };

//             await AxiosInstance.post('appointments/', payload);
//             setBooked(true);
//             showSuccess("Success! Your appointment is confirmed.");
//             setTimeout(() => router.push('/bookings'), 1500);
//         } catch (err: any) {
//             console.error(err);
//             showError(err.response?.data?.detail || "Booking failed.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // --- Calendar Helper Functions ---
//     const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
//     const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

//     const renderHeader = () => {
//         return (
//             <div className="d-flex align-items-center justify-content-between mb-4">
//                 <span className="fw-bold text-dark outfit fs-5">
//                     {format(currentMonth, 'MMMM yyyy')}
//                 </span>
//                 <div className="d-flex gap-2">
//                     <button onClick={prevMonth} className="btn btn-light btn-sm rounded-circle p-2 border shadow-sm">
//                         <ChevronLeft size={18} />
//                     </button>
//                     <button onClick={nextMonth} className="btn btn-light btn-sm rounded-circle p-2 border shadow-sm">
//                         <ChevronRight size={18} />
//                     </button>
//                 </div>
//             </div>
//         );
//     };

//     const renderDays = () => {
//         const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         return (
//             <div className="row g-0 mb-2">
//                 {days.map(day => (
//                     <div className="col text-center text-muted uppercase fw-bold" style={{ fontSize: '10px' }} key={day}>
//                         {day}
//                     </div>
//                 ))}
//             </div>
//         );
//     };

//     const renderCells = () => {
//         const monthStart = startOfMonth(currentMonth);
//         const monthEnd = endOfMonth(monthStart);
//         const startDate = startOfWeek(monthStart);
//         const endDate = endOfWeek(monthEnd);
//         const today = startOfDay(new Date());

//         const rows = [];
//         let days = [];
//         let day = startDate;
//         let formattedDate = "";

//         while (day <= endDate) {
//             for (let i = 0; i < 7; i++) {
//                 formattedDate = format(day, 'd');
//                 const cloneDay = day;
//                 const isSelected = isSameDay(day, selectedDate);
//                 const isCurrentMonth = isSameMonth(day, monthStart);
//                 const isPast = isBefore(day, today);

//                 days.push(
//                     <div className="col p-1" key={day.toString()}>
//                         <button
//                             disabled={isPast}
//                             onClick={() => setSelectedDate(cloneDay)}
//                             className={`
//                                 w-100 d-flex flex-column align-items-center justify-content-center rounded-3 border transition-all py-2
//                                 ${!isCurrentMonth ? 'text-muted opacity-25 bg-light border-0' : ''}
//                                 ${isSelected
//                                     ? 'bg-primary text-white border-primary shadow-md transform-scale'
//                                     : isPast
//                                         ? 'bg-light text-muted border-light-subtle cursor-not-allowed'
//                                         : 'bg-white text-dark border-light-subtle hover-bg-light'}
//                             `}
//                             style={{ height: '50px' }}
//                         >
//                             <span className={`fw-bold small ${isSelected ? 'text-white' : 'text-dark'}`}>
//                                 {formattedDate}
//                             </span>
//                         </button>
//                     </div>
//                 );
//                 day = addDays(day, 1);
//             }
//             rows.push(
//                 <div className="row g-0" key={day.toString()}>
//                     {days}
//                 </div>
//             );
//             days = [];
//         }
//         return <div className="calendar-grid">{rows}</div>;
//     };


//     if (!doctor && !loading) return (
//         <div className="min-vh-100 d-flex align-items-center justify-content-center flex-column gap-3">
//             <h3 className="fw-bold text-dark">Doctor not found</h3>
//             <button onClick={() => router.push('/home')} className="btn btn-primary rounded-pill px-4">Back to Dashboard</button>
//         </div>
//     );

//     return (
//         <div className="d-flex min-vh-100 bg-main">
//             <AnimatePresence>
//                 {loading && <LoadingOverlay />}
//             </AnimatePresence>

//             <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

//             <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
//                 <TacticalHeader title="Book Appointment" onMenuClick={() => setIsSidebarOpen(true)} />

//                 <main className="flex-grow-1 p-4 overflow-y-auto">
//                     {!doctor ? null : (
//                         <div className="row g-4">
//                             {/* LEFT COLUMN: SAME AS BEFORE */}
//                             <div className="col-12 col-xl-5">
//                                 <div className="d-flex flex-column gap-4">
//                                     {/* ... Doctor Profile Card Code (Unchanged) ... */}
//                                     <div className="glass-container p-0 overflow-hidden border-0 shadow-premium-lg mb-4">
//                                         <div className="p-4" style={{ background: 'linear-gradient(135deg, #46C2DE 0%, #37AECB 100%)' }}>
//                                             <div className="d-flex align-items-center gap-3">
//                                                 <button onClick={() => router.back()} className="btn btn-white btn-sm rounded-circle p-2 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
//                                                     <ArrowLeft size={18} className="text-white" />
//                                                 </button>
//                                                 <h5 className="fw-bold m-0 text-white outfit uppercase tracking-wider" style={{ fontSize: '1rem' }}>Doctor Profile</h5>
//                                             </div>
//                                         </div>

//                                         <div className="px-4 pb-4" style={{ marginTop: '-24px' }}>
//                                             <div className="bg-white bg-opacity-90 backdrop-blur-md rounded-4 p-4 shadow-sm border border-light-subtle">
//                                                 <div className="d-flex align-items-start justify-content-between mb-4">
//                                                     <div className="d-flex gap-3 align-items-center">
//                                                         <div className="rounded-4 overflow-hidden shadow-md border-2 border-white position-relative" style={{ width: '92px', height: '92px' }}>
//                                                             {doctor.image_url ? (
//                                                                 <Image src={doctor.image_url} alt={doctor.name} fill unoptimized className="object-cover" />
//                                                             ) : (
//                                                                 <div className="w-100 h-100 bg-primary-soft text-primary d-flex align-items-center justify-content-center outfit fw-bold fs-4">
//                                                                     {doctor.name.charAt(0)}
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                         <div>
//                                                             <h4 className="fw-bold text-dark outfit mb-1">{doctor.name}</h4>
//                                                             <span className="text-primary fw-bold small d-block mb-1">{doctor.specialization_name}</span>
//                                                             <div className="d-flex align-items-center gap-2 text-muted smallest fw-bold uppercase">
//                                                                 <Star size={12} className="text-warning fill-warning" />
//                                                                 <span>{doctor.rating} ({doctor.reviews_count} Reviews)</span>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {/* Info Cards (Unchanged) */}
//                                     <div className="glass-container p-4 border-0 shadow-premium mb-4">
//                                         <div className="mb-4">
//                                             <h6 className="fw-bold text-dark outfit mb-3 d-flex align-items-center gap-2">
//                                                 <Info size={18} className="text-primary" /> Specialist Insight
//                                             </h6>
//                                             <p className="text-muted small lh-lg mb-0 text-justify">{doctor.about}</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* RIGHT: Scheduling & Slots */}
//                             <div className="col-12 col-xl-7">
//                                 <div className="glass-container p-0 border-0 shadow-sm h-100 d-flex flex-column">
//                                     <div className="p-4 border-bottom bg-white sticky-top rounded-top" style={{ zIndex: 10 }}>
//                                         <h6 className="fw-bold m-0 text-dark outfit d-flex align-items-center gap-2">
//                                             <Calendar size={20} className="text-primary" />
//                                             Scheduling Details
//                                         </h6>
//                                     </div>

//                                     <div className="p-4 flex-grow-1">
//                                         {/* --- REAL CALENDAR IMPLEMENTATION --- */}
//                                         <div className="mb-5 bg-light bg-opacity-25 p-3 rounded-4 border border-light-subtle">
//                                             {renderHeader()}
//                                             {renderDays()}
//                                             {renderCells()}
//                                         </div>

//                                         <div className="d-flex align-items-center justify-content-between mb-3">
//                                             <h6 className="fw-bold text-dark m-0">Available Slots</h6>
//                                             <span className="text-muted small">
//                                                 {format(selectedDate, 'EEEE, MMMM do')}
//                                             </span>
//                                         </div>

//                                         <div className="row g-4">
//                                             {/* Morning Slots */}
//                                             <div className="col-12 col-md-6">
//                                                 <h6 className="fw-bold text-dark outfit mb-3 small d-flex align-items-center gap-2">
//                                                     <Clock size={16} className="text-warning" />
//                                                     Morning Slots
//                                                 </h6>
//                                                 <div className="row g-2">
//                                                     {doctor.slots.filter(s => s.time.includes('AM')).length > 0 ? (
//                                                         doctor.slots.filter(s => s.time.includes('AM')).map((slot) => (
//                                                             <div key={slot.id} className="col-6">
//                                                                 <button
//                                                                     onClick={() => setSelectedSlot(slot.id)}
//                                                                     disabled={slot.is_booked}
//                                                                     className={`btn w-100 py-2 rounded-3 border small fw-bold transition-all ${selectedSlot === slot.id
//                                                                             ? 'bg-primary-soft text-primary border-primary'
//                                                                             : slot.is_booked ? 'bg-light text-muted border-light text-decoration-line-through' : 'bg-white text-dark border-light-subtle hover-bg-light'
//                                                                         }`}
//                                                                 >
//                                                                     {slot.time}
//                                                                 </button>
//                                                             </div>
//                                                         ))
//                                                     ) : (
//                                                         <div className="col-12 text-muted small ps-3 fst-italic">No morning slots available</div>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             {/* Afternoon/Evening Slots */}
//                                             <div className="col-12 col-md-6">
//                                                 <h6 className="fw-bold text-dark outfit mb-3 small d-flex align-items-center gap-2">
//                                                     <Clock size={16} className="text-primary" />
//                                                     Afternoon/Evening Slots
//                                                 </h6>
//                                                 <div className="row g-2">
//                                                     {doctor.slots.filter(s => s.time.includes('PM')).length > 0 ? (
//                                                         doctor.slots.filter(s => s.time.includes('PM')).map((slot) => (
//                                                             <div key={slot.id} className="col-6">
//                                                                 <button
//                                                                     onClick={() => setSelectedSlot(slot.id)}
//                                                                     disabled={slot.is_booked}
//                                                                     className={`btn w-100 py-2 rounded-3 border small fw-bold transition-all ${selectedSlot === slot.id
//                                                                             ? 'bg-primary-soft text-primary border-primary'
//                                                                             : slot.is_booked ? 'bg-light text-muted border-light text-decoration-line-through' : 'bg-white text-dark border-light-subtle hover-bg-light'
//                                                                         }`}
//                                                                 >
//                                                                     {slot.time}
//                                                                 </button>
//                                                             </div>
//                                                         ))
//                                                     ) : (
//                                                         <div className="col-12 text-muted small ps-3 fst-italic">No evening slots available</div>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {/* Booking Footer */}
//                                     <div className="p-4 bg-light border-top mt-auto rounded-bottom">
//                                         <div className="row align-items-center">
//                                             <div className="col-md-6 mb-3 mb-md-0">
//                                                 <div className="d-flex gap-3 align-items-center">
//                                                     <div className="bg-white p-3 rounded-4 shadow-sm border">
//                                                         <div className="text-muted uppercase fw-bold" style={{ fontSize: '9px' }}>SELECTED SESSION</div>
//                                                         <div className="text-dark fw-bold fs-6">
//                                                             {selectedSlot
//                                                                 ? `${format(selectedDate, 'MMM dd')}, ${doctor.slots.find(s => s.id === selectedSlot)?.time}`
//                                                                 : 'Select a Date & Time'}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                             <div className="col-md-6 text-end">
//                                                 <button
//                                                     onClick={handleBook}
//                                                     disabled={!selectedSlot || booked || !!existingAppointment}
//                                                     className="btn btn-premium w-100 py-3 rounded-4 fw-bold shadow-md d-flex align-items-center justify-content-center gap-2"
//                                                     style={{
//                                                         background: (booked || existingAppointment) ? '#10B981' : 'linear-gradient(135deg, #46C2DE 0%, #37AECB 100%)',
//                                                         border: 'none',
//                                                         color: 'white'
//                                                     }}
//                                                 >
//                                                     {booked || existingAppointment ? <><CheckCircle size={20} /> Appointment Confirmed</> : <><Calendar size={20} /> Book Appointment</>}
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </main>
//             </div>

//             <style jsx>{`
//                 .scroll-hide::-webkit-scrollbar { display: none; }
//                 .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
//                 .hover-bg-light:hover { background: #f8fafc !important; }
//                 .transform-scale:active { transform: scale(0.95); }
//                 .bg-primary-soft { background: rgba(70, 194, 222, 0.1); }
//                 .cursor-not-allowed { cursor: not-allowed; }
//             `}</style>
//         </div>
//     );
// }
