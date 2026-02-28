"use client";

import { useEffect, useState } from "react";
import AxiosInstance from "@/lib/AxiosInstance";
import { Calendar, Star, Heart, Activity, Phone, Zap, Stethoscope, Sparkles, FileText, MapPin, Plus, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";

import LoadingOverlay from "../../components/LoadingOverlay";
import { showError } from "@/lib/alerts";

interface Doctor {
    id: number;
    name: string;
    specialization_name: string;
    experience: number;
    rating: number;
    reviews_count: number;
    image_url: string;
    availability_time: string;
}



export default function HomePage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userName, setUserName] = useState("Member");
    const router = useRouter();

    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Fetch Doctors (AllowAny)
            try {
                const docsRes = await AxiosInstance.get('doctors/');
                setDoctors(docsRes.data);
            } catch (err) {
                console.error("Specialist Fetch Error:", err);
            }

            // Fetch Appointments (Requires Authentication)
            try {
                const apptsRes = await AxiosInstance.get('appointments/');
                setAppointments(apptsRes.data);
            } catch (err) {
                console.error("Appointment Fetch Error:", err);
                // We don't show error here as it might be a guest user
            }

            setLoading(false);
        };
        fetchData();
    }, []);



    return (
        <div className="d-flex min-vh-100 bg-main position-relative">
            <AnimatePresence>
                {loading && <LoadingOverlay />}
            </AnimatePresence>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="Medical Dashboard" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    {/* Welcome Section */}
                    <div className="mb-5 row g-4 align-items-center">
                        <div className="col-12">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="d-flex align-items-center gap-2 mb-3"
                            >
                                <div className="bg-primary-soft p-2 rounded-circle">
                                    <Sparkles size={14} className="text-primary" />
                                </div>
                                <span className="text-primary fw-bold smallest text-uppercase outfit tracking-widest letter-spacing-1">Smart Health Dashboard</span>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                                className="fw-bold text-dark outfit display-4 mb-2 tracking-tight"
                            >
                                Good Morning, <span className="text-primary">{userName}</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-muted fs-5 fw-normal"
                            >
                                You have <span className="text-dark fw-bold">{appointments.filter(a => a.status === 'Upcoming').length} appointments</span> scheduled.
                            </motion.p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="row g-4 mb-5">
                        {[
                            { label: 'Total Visits', value: appointments.length.toString(), icon: Activity, color: '#46C2DE' },
                            { label: 'Upcoming', value: appointments.filter(a => a.status === 'Upcoming').length.toString().padStart(2, '0'), icon: Calendar, color: '#10B981' },
                            { label: 'Health Vault', value: '18', icon: FileText, color: '#FBBF24' },
                            { label: 'Consultations', value: '12', icon: Stethoscope, color: '#8B5CF6' },
                        ].map((stat, i) => (
                            <div key={i} className="col-12 col-md-6 col-xl-3">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, type: "spring", damping: 15 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className="glass-container p-4 border-0 h-100 overflow-hidden"
                                >
                                    <div className="d-flex align-items-start justify-content-between mb-3">
                                        <div className="rounded-4 p-3 d-flex align-items-center justify-content-center" style={{ background: `${stat.color}10` }}>
                                            <stat.icon size={24} style={{ color: stat.color }} />
                                        </div>
                                        <motion.span
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="badge bg-light text-muted border smallest fw-bold"
                                        >
                                            +12%
                                        </motion.span>
                                    </div>
                                    <h3 className="fw-bold mb-1 text-dark outfit">{stat.value}</h3>
                                    <span className="text-muted small fw-medium">{stat.label}</span>
                                    {/* Border Animation Effect */}
                                    <div className="position-absolute bottom-0 start-0 w-100 h-1" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`, height: '3px', opacity: 0.3 }} />
                                </motion.div>
                            </div>
                        ))}
                    </div>

                    <div className="row g-4">
                        {/* LEFT: Main Feed */}
                        <div className="col-12 col-xl-8">
                            <div className="d-flex flex-column gap-5">
                                {/* Featured Doctor Hero */}
                                {doctors.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="glass-card-dark p-4 p-xl-5 rounded-4 position-relative overflow-hidden shadow-lg border-0"
                                    >
                                        <div className="position-relative z-2">
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <span className="badge bg-primary text-white px-3 py-2 fw-bold text-uppercase rounded-3" style={{ fontSize: '10px', letterSpacing: '1px' }}>Featured Specialist</span>
                                                <div className="d-flex align-items-center gap-1 text-white">
                                                    <Star size={16} className="text-warning fill-warning" />
                                                    <span className="fw-bold">{doctors[0].rating}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-4 align-items-center flex-wrap">
                                                <motion.div
                                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                                    className="rounded-circle overflow-hidden border border-white border-opacity-20 shadow-xl"
                                                    style={{ width: '140px', height: '140px' }}
                                                >
                                                    <NextImage src={doctors[0].image_url} alt={doctors[0].name} width={140} height={140} className="object-cover" />
                                                </motion.div>
                                                <div className="flex-grow-1">
                                                    <h2 className="fw-bold mb-1 outfit text-white display-6">{doctors[0].name}</h2>
                                                    <p className="text-primary fw-bold fs-5 mb-3">{doctors[0].specialization_name}</p>
                                                    <div className="d-flex gap-4 text-white">
                                                        <div>
                                                            <span className="d-block smallest text-white-50 uppercase fw-bold mb-1">Experience</span>
                                                            <span className="fw-bold fs-5">{doctors[0].experience} Years</span>
                                                        </div>
                                                        <div className="border-start border-white border-opacity-10 ps-4">
                                                            <span className="d-block smallest text-white-50 uppercase fw-bold mb-1">Patients</span>
                                                            <span className="fw-bold fs-5">4.8k+</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-5 d-flex gap-3">
                                                <button onClick={() => router.push(`/doctor/${doctors[0].id}`)} className="btn btn-primary px-5 py-3 fw-bold rounded-3 shadow-primary transition-all">Book Instant Consultation</button>
                                                <button className="btn btn-outline-light px-4 py-3 fw-bold rounded-3 border-white border-opacity-20">View Bio</button>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1], rotate: [12, 15, 12] }}
                                            transition={{ duration: 10, repeat: Infinity }}
                                            className="position-absolute top-0 end-0 p-0 opacity-10 translate-middle-x mt-n5 me-n5 rotate-12"
                                        >
                                            <Heart size={400} fill="currentColor" className="text-primary" />
                                        </motion.div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Appointments & Quick Actions */}
                        <div className="col-12 col-xl-4">
                            <div className="d-flex flex-column gap-5">
                                {/* Upcoming Appointments */}
                                <div className="glass-container p-4 bg-white border-0 shadow-lg">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold m-0 text-dark outfit">Schedule</h5>
                                        <button className="btn btn-primary-soft btn-sm p-2 rounded-3"><Plus size={16} /></button>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {appointments.filter(a => a.status === 'Upcoming').slice(0, 3).length > 0 ? (
                                            appointments.filter(a => a.status === 'Upcoming').slice(0, 3).map((appt, i) => (
                                                <div key={i} onClick={() => router.push('/bookings')} className="p-3 rounded-4 border border-light-subtle transition-all hover-bg-light cursor-pointer">
                                                    <div className="d-flex gap-3 align-items-center">
                                                        <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#46C2DE' }}></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="small fw-bold mb-0 text-dark">{appt.doctor_name}</h6>
                                                            <p className="smallest text-muted mb-0">{new Date(appt.appointment_date).toLocaleDateString()} at {appt.slot_time}</p>
                                                        </div>
                                                        <span className="smallest fw-bold p-1 px-2 rounded-2" style={{ backgroundColor: `rgba(70, 194, 222, 0.1)`, color: '#46C2DE' }}>Clinical Visit</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-muted small">No upcoming appointments</div>
                                        )}
                                    </div>
                                    <button onClick={() => router.push('/bookings')} className="btn btn-outline-light w-100 rounded-3 py-3 smallest fw-bold text-muted border-light-subtle mt-4">View All Appointments</button>
                                </div>

                                {/* Quick Actions */}
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                        <h5 className="fw-bold m-0 text-dark outfit">Quick Actions</h5>
                                    </div>
                                    <div className="row g-3">
                                        {[
                                            { label: 'Pharmacy', icon: Heart, color: '#FF6B6B' },
                                            { label: 'Lab Tests', icon: Activity, color: '#8B5CF6' },
                                            { label: 'E-Report', icon: FileText, color: '#46C2DE' },
                                            { label: 'Hospitals', icon: MapPin, color: '#10B981' }
                                        ].map((action, i) => (
                                            <div key={i} className="col-6">
                                                <motion.button
                                                    whileHover={{ scale: 1.05, y: -5 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="glass-container w-100 py-4 px-2 border-0 d-flex flex-column align-items-center gap-3 transition-all"
                                                >
                                                    <div className="p-3 rounded-circle shadow-sm bg-white" style={{ border: `1px solid ${action.color}20` }}>
                                                        <action.icon size={22} style={{ color: action.color }} />
                                                    </div>
                                                    <span className="smallest fw-bold text-dark uppercase tracking-wider">{action.label}</span>
                                                </motion.button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx>{`
                .hover-bg-white:hover { background: white !important; color: var(--primary) !important; }
            `}</style>
        </div>
    );
}
