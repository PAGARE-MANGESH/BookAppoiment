"use client";

import { useEffect, useState } from "react";
import AxiosInstance from "@/lib/AxiosInstance";
import { Calendar, Search, Clock, CheckCircle, XCircle, Download, Plus, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AppointmentCard from "@/components/AppointmentCard";
import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";

interface Appointment {
    id: number;
    doctor_name: string;
    specialization_name: string;
    slot_time: string;
    appointment_date: string;
    patient_name: string;
    status: string;
}

import LoadingOverlay from "../../components/LoadingOverlay";
import { showError, showSuccess, showConfirm } from "@/lib/alerts";

export default function BookingsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [activeTab, setActiveTab] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await AxiosInstance.get('appointments/');
            setAppointments(response.data);
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
            showError("Unable to retrieve your appointment history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (id: number) => {
        const result = await showConfirm(
            "Cancel Appointment?",
            "This will permanently terminate your scheduled medical visit."
        );

        if (result.isConfirmed) {
            try {
                await AxiosInstance.patch(`appointments/${id}/`, { status: 'Canceled' });
                showSuccess("Appointment terminated successfully.");
                fetchBookings();
            } catch (err) {
                showError("Termination protocol failed.");
            }
        }
    };

    const filteredBookings = appointments
        .filter(b => {
            if (activeTab === 'Pending') return b.status === 'Upcoming' || b.status === 'Accepted';
            if (activeTab === 'Booked') return b.status === 'Booked';
            if (activeTab === 'Completed') return b.status === 'Completed';
            if (activeTab === 'Archived') return b.status === 'Canceled' || b.status === 'Rejected';
            return true;
        })
        .filter(b =>
            b.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.specialization_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const totalPending = appointments.filter(b => b.status === 'Upcoming' || b.status === 'Accepted').length;
    const totalBooked = appointments.filter(b => b.status === 'Booked').length;
    const totalCompleted = appointments.filter(b => b.status === 'Completed').length;
    const totalArchived = appointments.filter(b => b.status === 'Canceled' || b.status === 'Rejected').length;

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>
                {loading && <LoadingOverlay />}
            </AnimatePresence>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="My Appointments" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    {/* Header Section */}
                    <div className="d-flex justify-content-between align-items-end flex-wrap gap-4 mb-5">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="d-flex align-items-center gap-2 mb-2"
                            >
                                <Calendar size={14} className="text-primary" />
                                <span className="text-primary fw-bold smallest uppercase tracking-widest letter-spacing-1">Personal Healthcare Schedule</span>
                            </motion.div>
                            <h2 className="fw-bold text-dark outfit display-6 mb-1 tracking-tight">Booking History</h2>
                            <p className="text-muted fw-medium mb-0">Track, manage and download your appointment sessions.</p>
                        </div>
                        <button onClick={() => router.push('/doctor')} className="btn btn-premium d-flex align-items-center gap-3 px-4 py-3 shadow-premium">
                            <Plus size={20} /> <span className="fw-bold">New Medical Visit</span>
                        </button>
                    </div>

                    <div className="row g-4">
                        {/* LEFT: Filters */}
                        <div className="col-12 col-xl-3">
                            <div className="d-flex flex-column gap-4">
                                <div className="glass-container p-4 border-0 shadow-lg bg-white">
                                    <h6 className="fw-bold mb-3 text-dark outfit uppercase smallest tracking-wider opacity-75">Search Specialist</h6>
                                    <div className="position-relative">
                                        <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-primary opacity-50" size={18} />
                                        <input
                                            type="text"
                                            className="form-control-premium w-100 ps-5 py-3 border-0 bg-light bg-opacity-50"
                                            placeholder="Doctor name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                <div className="glass-container p-4 border-0 shadow-lg bg-white">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h6 className="fw-bold m-0 text-dark outfit uppercase smallest tracking-wider opacity-75">Status Categorization</h6>
                                        <button onClick={fetchBookings} className="btn btn-primary-soft p-1.5 rounded-circle shadow-xs transition-all">
                                            <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ repeat: loading ? Infinity : 0, duration: 1, ease: "linear" }}>
                                                <RotateCw size={14} className="text-primary" />
                                            </motion.div>
                                        </button>
                                    </div>

                                    <div className="d-flex flex-column gap-2">
                                        {[
                                            { tab: 'Pending', icon: Clock, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', count: totalPending },
                                            { tab: 'Booked', icon: Calendar, color: 'var(--primary)', bg: 'rgba(70, 194, 222, 0.1)', count: totalBooked },
                                            { tab: 'Completed', icon: CheckCircle, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', count: totalCompleted },
                                            { tab: 'Archived', icon: XCircle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', count: totalArchived },
                                        ].map((item) => (
                                            <button
                                                key={item.tab}
                                                onClick={() => setActiveTab(item.tab)}
                                                className={`btn text-start d-flex align-items-center justify-content-between p-3 rounded-4 transition-all border-0 ${activeTab === item.tab
                                                    ? 'shadow-md fw-bold active-tab'
                                                    : 'text-muted hover-bg-light'
                                                    }`}
                                                style={activeTab === item.tab ? { background: item.bg, color: item.color } : {}}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <item.icon size={18} />
                                                    <span className="small">{item.tab}</span>
                                                </div>
                                                <span className={`badge rounded-pill ${activeTab === item.tab ? 'bg-white' : 'bg-light text-muted'}`} style={activeTab === item.tab ? { color: item.color } : {}}>{item.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-container p-4 border-0 shadow-lg bg-white">
                                    <h6 className="fw-bold mb-3 text-dark outfit uppercase smallest tracking-wider opacity-75">Resources</h6>
                                    <button className="btn btn-outline-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 rounded-4 fw-bold small transition-all">
                                        <Download size={18} /> Export Records (PDF)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Appointments List */}
                        <div className="col-12 col-xl-9">
                            <AnimatePresence mode="wait">
                                {filteredBookings.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        key="empty"
                                        className="glass-container p-5 text-center border-0 shadow-lg bg-white d-flex flex-column align-items-center justify-content-center"
                                        style={{ minHeight: '500px' }}
                                    >
                                        <div className="bg-primary-soft p-4 rounded-circle mb-4">
                                            <Calendar size={60} className="text-primary opacity-30" />
                                        </div>
                                        <h4 className="fw-bold text-dark outfit mb-2">No {activeTab} Records found.</h4>
                                        <p className="text-muted mb-5 fw-medium">You don&apos;t have any appointments in this category yet.</p>
                                        <button onClick={() => router.push('/doctor')} className="btn btn-premium px-5 py-3 rounded-pill fw-bold shadow-premium">
                                            Browse Top Specialists
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="row g-4" key="list">
                                        {filteredBookings.map((booking, idx) => (
                                            <div key={booking.id} className="col-12 col-lg-6 col-xxl-4">
                                                <AppointmentCard booking={booking} idx={idx} onCancel={handleCancel} onUpdate={fetchBookings} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
