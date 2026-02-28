"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle, Clock, XCircle, Users, Star, Stethoscope, TrendingUp, Activity, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";
import LoadingOverlay from "@/components/LoadingOverlay";
import AxiosInstance from "@/lib/AxiosInstance";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

interface DoctorInfo {
    id: number;
    name: string;
    specialization_name: string;
    experience: number;
    rating: number;
    reviews_count: number;
    image_url: string;
    availability_time: string;
    location: string;
}

interface Appointment {
    id: number;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    problem: string;
    status: string;
    appointment_date: string;
    slot_time: string;
}

export default function DoctorDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [userName, setUserName] = useState("Doctor");
    const router = useRouter();

    useEffect(() => {
        const name = localStorage.getItem("user_name");
        if (name) setUserName(name);

        const role = localStorage.getItem("user_role");
        if (role !== "doctor") {
            router.push("/home");
            return;
        }

        const fetchData = async () => {
            try {
                const [apptRes, profileRes] = await Promise.all([
                    AxiosInstance.get("doctor-appointments/"),
                    AxiosInstance.get("profile/"),
                ]);
                setAppointments(apptRes.data);

                // Fetch doctor details using doctor_id
                const doctorId = profileRes.data.doctor_id;
                if (doctorId) {
                    const docRes = await AxiosInstance.get(`doctors/${doctorId}/`);
                    setDoctorInfo(docRes.data);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router]);

    const stats = {
        total: appointments.length,
        upcoming: appointments.filter(a => a.status === "Upcoming").length,
        accepted: appointments.filter(a => a.status === "Accepted").length,
        completed: appointments.filter(a => a.status === "Completed").length,
        rejected: appointments.filter(a => a.status === "Rejected").length,
    };

    const recent = appointments.slice(0, 5);

    const statusColor: Record<string, string> = {
        Upcoming: "#F59E0B",
        Accepted: "#10B981",
        Completed: "#46C2DE",
        Canceled: "#94A3B8",
        Rejected: "#EF4444",
    };

    const getInitials = (name: string) =>
        name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>{loading && <LoadingOverlay />}</AnimatePresence>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="Doctor Dashboard" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    <div className="container-fluid p-0">

                        {/* Doctor Profile Hero */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-5 overflow-hidden mb-5 position-relative"
                            style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)", minHeight: "220px" }}
                        >
                            {/* Decorative circles */}
                            <div className="position-absolute" style={{ top: -60, right: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(70,194,222,0.07)" }} />
                            <div className="position-absolute" style={{ bottom: -40, right: 200, width: 150, height: 150, borderRadius: "50%", background: "rgba(16,185,129,0.07)" }} />

                            <div className="p-4 p-xl-5 d-flex align-items-center gap-4 flex-wrap position-relative">
                                <div className="position-relative">
                                    <div className="rounded-circle overflow-hidden border-4 border-white shadow-lg position-relative"
                                        style={{ width: 110, height: 110, border: "4px solid rgba(255,255,255,0.3)" }}>
                                        {doctorInfo?.image_url ? (
                                            <NextImage src={doctorInfo.image_url} alt={doctorInfo.name} fill unoptimized className="object-cover" />
                                        ) : (
                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center outfit fw-bold display-5 text-white"
                                                style={{ background: "rgba(70,194,222,0.2)" }}>
                                                {getInitials(doctorInfo?.name || userName)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                                        style={{ width: 20, height: 20 }} />
                                </div>

                                <div>
                                    <div className="badge px-3 py-1 mb-2 rounded-pill fw-bold smallest uppercase tracking-widest"
                                        style={{ background: "rgba(70,194,222,0.2)", color: "#46C2DE" }}>
                                        <Stethoscope size={12} className="me-1" /> {doctorInfo?.specialization_name || "Specialist"}
                                    </div>
                                    <h1 className="outfit fw-bold text-white mb-1" style={{ fontSize: "2rem" }}>
                                        Dr. {doctorInfo?.name || userName}
                                    </h1>
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <span className="text-white-50 small">{doctorInfo?.experience || 0} yrs experience</span>
                                        <span className="d-flex align-items-center gap-1 text-warning small fw-bold">
                                            <Star size={14} fill="currentColor" /> {doctorInfo?.rating || "5.0"}
                                        </span>
                                        <span className="text-white-50 small">{doctorInfo?.reviews_count || 0} reviews</span>
                                    </div>
                                </div>

                                <div className="ms-auto d-none d-lg-block text-end">
                                    <div className="text-white-50 smallest fw-bold uppercase tracking-widest mb-1">Availability</div>
                                    <div className="text-white fw-bold small">{doctorInfo?.availability_time || "10 AM – 5 PM"}</div>
                                    <div className="text-white-50 small mt-1">{doctorInfo?.location || ""}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats Cards */}
                        <div className="row g-4 mb-5">
                            {[
                                { label: "Total Patients", value: stats.total, icon: Users, color: "#46C2DE", bg: "rgba(70,194,222,0.1)" },
                                { label: "Pending Review", value: stats.upcoming, icon: Clock, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
                                { label: "Accepted", value: stats.accepted, icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.1)" },
                                { label: "Completed", value: stats.completed, icon: TrendingUp, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
                            ].map((stat, i) => (
                                <div key={i} className="col-6 col-xl-3">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="bg-white rounded-4 p-4 shadow-sm h-100"
                                        style={{ border: `1px solid ${stat.color}20` }}
                                    >
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="p-2 rounded-3" style={{ background: stat.bg }}>
                                                <stat.icon size={22} style={{ color: stat.color }} />
                                            </div>
                                            <Activity size={14} className="text-muted opacity-40" />
                                        </div>
                                        <div className="outfit fw-bold mb-1" style={{ fontSize: "2.2rem", color: stat.color }}>{stat.value}</div>
                                        <div className="smallest fw-bold text-muted uppercase tracking-widest">{stat.label}</div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Appointments */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-4 shadow-sm overflow-hidden"
                            style={{ border: "1px solid #F1F5F9" }}
                        >
                            <div className="p-4 d-flex align-items-center justify-content-between border-bottom border-light">
                                <h5 className="fw-bold m-0 outfit">Recent Appointments</h5>
                                <button
                                    onClick={() => router.push("/doctor-appointments")}
                                    className="btn btn-sm btn-light rounded-pill px-4 fw-bold d-flex align-items-center gap-1"
                                >
                                    View All <ChevronRight size={16} />
                                </button>
                            </div>

                            {recent.length === 0 ? (
                                <div className="p-5 text-center text-muted">
                                    <Calendar size={40} className="mb-3 opacity-20" />
                                    <p className="fw-bold">No appointments yet</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead style={{ background: "#F8FAFC" }}>
                                            <tr>
                                                <th className="px-4 py-3 smallest fw-bold text-muted uppercase tracking-widest border-0">Patient</th>
                                                <th className="py-3 smallest fw-bold text-muted uppercase tracking-widest border-0">Date & Time</th>
                                                <th className="py-3 smallest fw-bold text-muted uppercase tracking-widest border-0 d-none d-md-table-cell">Problem</th>
                                                <th className="py-3 smallest fw-bold text-muted uppercase tracking-widest border-0">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recent.map((appt, i) => (
                                                <tr key={appt.id} className="border-0">
                                                    <td className="px-4 py-3 border-0">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white smallest"
                                                                style={{ width: 36, height: 36, background: "#46C2DE", flexShrink: 0 }}>
                                                                {appt.patient_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="fw-bold text-dark small">{appt.patient_name}</div>
                                                                <div className="text-muted smallest">{appt.patient_age}y · {appt.patient_gender}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 border-0">
                                                        <div className="fw-bold small text-dark">{appt.appointment_date}</div>
                                                        <div className="text-muted smallest">{appt.slot_time}</div>
                                                    </td>
                                                    <td className="py-3 border-0 d-none d-md-table-cell">
                                                        <span className="small text-muted text-truncate d-block" style={{ maxWidth: 200 }}>{appt.problem}</span>
                                                    </td>
                                                    <td className="py-3 border-0">
                                                        <span className="badge rounded-pill px-3 py-1 fw-bold smallest"
                                                            style={{ background: `${statusColor[appt.status] || "#94A3B8"}20`, color: statusColor[appt.status] || "#94A3B8" }}>
                                                            {appt.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
