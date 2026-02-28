"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, XCircle, Calendar, Search, Filter, Clock, User,
    ChevronDown, RefreshCw, Stethoscope, AlertCircle, Pencil, Save, X
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";
import LoadingOverlay from "@/components/LoadingOverlay";
import AxiosInstance from "@/lib/AxiosInstance";
import { showSuccess, showError, showConfirm } from "@/lib/alerts";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

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

const STATUS_TAB: Record<string, string> = {
    All: "",
    Pending: "Upcoming",
    Approved: "Accepted",
    Booked: "Booked",
    Completed: "Completed",
    Rejected: "Rejected",
};

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
    Upcoming: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", label: "Pending Approval" },
    Accepted: { color: "#46C2DE", bg: "rgba(70,194,222,0.1)", label: "Approved (Unpaid)" },
    Booked: { color: "#10B981", bg: "rgba(16,185,129,0.1)", label: "Booked & Paid" },
    Completed: { color: "#6366F1", bg: "rgba(99,102,241,0.1)", label: "Completed" },
    Canceled: { color: "#94A3B8", bg: "rgba(148,163,184,0.1)", label: "Canceled" },
    Rejected: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", label: "Rejected" },
};

export default function DoctorAppointmentsPage() {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [activeTab, setActiveTab] = useState("All");
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ appointment_date: "", slot: 0, problem: "" });
    const [slots, setSlots] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem("user_role");
        if (role !== "doctor") { router.push("/home"); return; }
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setSyncing(true);
        try {
            const res = await AxiosInstance.get("doctor-appointments/");
            setAppointments(res.data);
        } catch (err) {
            showError("Failed to load appointments.");
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    };

    const handleAction = async (id: number, newStatus: "Accepted" | "Rejected" | "Completed") => {
        const labels: Record<string, string> = {
            Accepted: "approve",
            Rejected: "reject",
            Completed: "mark as completed",
        };
        const appt = appointments.find(a => a.id === id);
        const result = await showConfirm(
            `${newStatus === "Accepted" ? "Approve" : newStatus === "Rejected" ? "Reject" : "Complete"} Appointment`,
            `Are you sure you want to ${labels[newStatus]} the appointment for ${appt?.patient_name}?`
        );
        if (!result.isConfirmed) return;

        setUpdating(id);
        try {
            await AxiosInstance.patch(`doctor-appointments/${id}/update_status/`, { status: newStatus });

            // Mock notification trigger
            const mockNotif = {
                id: Date.now(),
                type: newStatus.toLowerCase(),
                message: `Appointment for ${appt?.patient_name} ${newStatus === "Accepted" ? "approved" : newStatus.toLowerCase()}!`,
                time: new Date().toISOString()
            };
            const existingNotifs = JSON.parse(localStorage.getItem('user_notifications') || '[]');
            localStorage.setItem('user_notifications', JSON.stringify([mockNotif, ...existingNotifs]));

            showSuccess(`Appointment ${newStatus === "Accepted" ? "approved" : newStatus.toLowerCase()} successfully!`);
            setAppointments(prev =>
                prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
            );
        } catch (err: any) {
            showError(err.response?.data?.error || "Failed to update appointment.");
        } finally {
            setUpdating(null);
        }
    };

    const startEditing = async (appt: Appointment) => {
        setEditingId(appt.id);
        setEditData({
            appointment_date: appt.appointment_date,
            slot: 0, // Slot ID is not in the Appointment interface, we'll need to fetch slots first
            problem: appt.problem
        });

        // Fetch all slots to populate dropdown
        try {
            const res = await AxiosInstance.get("doctor-slots/");
            setSlots(res.data);
        } catch (err) {
            showError("Failed to load available slots.");
        }
    };

    const handleUpdate = async (id: number) => {
        setUpdating(id);
        try {
            const payload: any = { ...editData };
            if (payload.slot === 0) delete payload.slot; // Don't send 0

            await AxiosInstance.patch(`doctor-appointments/${id}/`, payload);
            showSuccess("Appointment rescheduled successfully!");
            setEditingId(null);
            fetchAppointments();
        } catch (err: any) {
            showError(err.response?.data?.error || "Failed to update appointment.");
        } finally {
            setUpdating(null);
        }
    };

    const filtered = useMemo(() => {
        let data = [...appointments];
        if (STATUS_TAB[activeTab]) {
            data = data.filter(a => a.status === STATUS_TAB[activeTab]);
        }
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(a =>
                a.patient_name.toLowerCase().includes(q) ||
                a.problem.toLowerCase().includes(q) ||
                a.appointment_date.includes(q)
            );
        }
        return data;
    }, [appointments, activeTab, search]);

    const counts: Record<string, number> = useMemo(() => ({
        All: appointments.length,
        Pending: appointments.filter(a => a.status === "Upcoming").length,
        Approved: appointments.filter(a => a.status === "Accepted").length,
        Booked: appointments.filter(a => a.status === "Booked").length,
        Completed: appointments.filter(a => a.status === "Completed").length,
        Rejected: appointments.filter(a => a.status === "Rejected").length,
    }), [appointments]);

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>{loading && <LoadingOverlay />}</AnimatePresence>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="Appointment Manager" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    <div className="container-fluid p-0">

                        {/* Page Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-5"
                        >
                            <div>
                                <h2 className="outfit fw-bold text-dark m-0 mb-1">Patient Queue</h2>
                                <p className="text-muted small m-0">Review, accept or reject incoming appointment requests</p>
                            </div>
                            <button
                                onClick={fetchAppointments}
                                className="btn btn-light rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm border"
                                disabled={syncing}
                            >
                                <RefreshCw size={16} className={syncing ? "spin" : ""} />
                                {syncing ? "Syncing..." : "Refresh"}
                            </button>
                        </motion.div>

                        <div className="row g-4">
                            {/* Sidebar Filter */}
                            <div className="col-12 col-lg-3">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white rounded-4 shadow-sm p-3"
                                    style={{ border: "1px solid #F1F5F9", position: "sticky", top: "20px" }}
                                >
                                    <div className="mb-3">
                                        <div className="smallest fw-bold text-muted uppercase tracking-widest mb-2 px-2">Search</div>
                                        <div className="position-relative">
                                            <Search size={16} className="position-absolute text-muted" style={{ left: 12, top: "50%", transform: "translateY(-50%)" }} />
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                placeholder="Patient, problem..."
                                                className="form-control border-0 bg-light rounded-3 ps-5"
                                                style={{ fontSize: "0.875rem" }}
                                            />
                                        </div>
                                    </div>

                                    <div className="smallest fw-bold text-muted uppercase tracking-widest mb-2 px-2">Filter by Status</div>
                                    {Object.keys(STATUS_TAB).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`w-100 text-start px-3 py-2 rounded-3 border-0 fw-bold small mb-1 d-flex align-items-center justify-content-between ${activeTab === tab ? "bg-primary text-white" : "bg-transparent text-muted"}`}
                                            style={{ transition: "all 0.2s" }}
                                        >
                                            <span>{tab}</span>
                                            <span className={`badge rounded-pill ${activeTab === tab ? "bg-white text-primary" : "bg-light text-muted"}`}>
                                                {counts[tab]}
                                            </span>
                                        </button>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Appointment Cards */}
                            <div className="col-12 col-lg-9">
                                {filtered.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-white rounded-4 shadow-sm p-5 text-center"
                                    >
                                        <Calendar size={48} className="text-muted mb-3 opacity-20" />
                                        <h6 className="fw-bold text-dark outfit">No appointments found</h6>
                                        <p className="text-muted small">Try changing the filter or search query.</p>
                                    </motion.div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {filtered.map((appt, i) => {
                                            const meta = STATUS_META[appt.status] || STATUS_META["Canceled"];
                                            const isPending = appt.status === "Upcoming";
                                            const isProcessing = updating === appt.id;

                                            return (
                                                <motion.div
                                                    key={appt.id}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="bg-white rounded-4 shadow-sm overflow-hidden"
                                                    style={{ border: `1px solid ${meta.color}30` }}
                                                >
                                                    {/* Status stripe */}
                                                    <div style={{ height: "4px", background: meta.color }} />

                                                    <div className="p-4">
                                                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                                                            <div className="d-flex align-items-center gap-3">
                                                                {/* Avatar */}
                                                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white outfit"
                                                                    style={{ width: 52, height: 52, background: meta.color, fontSize: "1.2rem", flexShrink: 0 }}>
                                                                    {appt.patient_name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h6 className="fw-bold text-dark m-0 outfit">{appt.patient_name}</h6>
                                                                    <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                                                                        <span className="text-muted smallest">{appt.patient_age} yrs · {appt.patient_gender}</span>
                                                                        <span style={{ color: meta.color }} className="badge rounded-pill px-2 py-1 smallest fw-bold"
                                                                            data-bg={meta.bg}>
                                                                            {meta.label}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Date & Time */}
                                                            <div className="text-end">
                                                                <div className="d-flex align-items-center gap-2 justify-content-end text-muted small">
                                                                    <Calendar size={14} />
                                                                    <span className="fw-semibold">{appt.appointment_date}</span>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2 justify-content-end text-muted small mt-1">
                                                                    <Clock size={14} />
                                                                    <span>{appt.slot_time}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Problem / Edit Form */}
                                                        <div className="mt-3 p-3 rounded-3" style={{ background: "#F8FAFC" }}>
                                                            {editingId === appt.id ? (
                                                                <div className="row g-3">
                                                                    <div className="col-12 col-md-4">
                                                                        <label className="smallest fw-bold text-muted uppercase tracking-widest mb-1 d-block">Reschedule Date</label>
                                                                        <input
                                                                            type="date"
                                                                            className="form-control form-control-sm"
                                                                            value={editData.appointment_date}
                                                                            onChange={e => setEditData({ ...editData, appointment_date: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className="col-12 col-md-4">
                                                                        <label className="smallest fw-bold text-muted uppercase tracking-widest mb-1 d-block">New Time Slot</label>
                                                                        <select
                                                                            className="form-select form-select-sm"
                                                                            value={editData.slot}
                                                                            onChange={e => setEditData({ ...editData, slot: parseInt(e.target.value) })}
                                                                        >
                                                                            <option value={0}>Keep current ({appt.slot_time})</option>
                                                                            {slots.filter(s => !s.is_booked).map(s => (
                                                                                <option key={s.id} value={s.id}>{s.time} ({s.shift})</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="col-12">
                                                                        <label className="smallest fw-bold text-muted uppercase tracking-widest mb-1 d-block">Treatment/Problem Update</label>
                                                                        <textarea
                                                                            className="form-control form-control-sm"
                                                                            rows={2}
                                                                            value={editData.problem}
                                                                            onChange={e => setEditData({ ...editData, problem: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className="col-12 d-flex gap-2">
                                                                        <button
                                                                            onClick={() => handleUpdate(appt.id)}
                                                                            disabled={updating === appt.id}
                                                                            className="btn btn-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
                                                                        >
                                                                            {updating === appt.id ? <span className="spinner-border spinner-border-sm" /> : <><Save size={14} /> Save Changes</>}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingId(null)}
                                                                            className="btn btn-light btn-sm rounded-pill px-3"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="d-flex align-items-start justify-content-between gap-2">
                                                                    <div className="d-flex align-items-start gap-2">
                                                                        <AlertCircle size={16} className="text-muted mt-1 flex-shrink-0" />
                                                                        <div>
                                                                            <div className="smallest fw-bold text-muted uppercase tracking-widest mb-1">Chief Complaint</div>
                                                                            <p className="small text-dark m-0 fw-medium">{appt.problem}</p>
                                                                        </div>
                                                                    </div>
                                                                    {!appt.status.match(/Completed|Rejected|Canceled/) && (
                                                                        <button
                                                                            onClick={() => startEditing(appt)}
                                                                            className="btn btn-light-primary btn-sm rounded-circle p-2"
                                                                            title="Edit/Reschedule"
                                                                        >
                                                                            <Pencil size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        {isPending && (
                                                            <div className="d-flex gap-3 mt-3">
                                                                <button
                                                                    onClick={() => handleAction(appt.id, "Accepted")}
                                                                    disabled={isProcessing}
                                                                    className="btn flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                                                                    style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "none" }}
                                                                >
                                                                    {isProcessing ? (
                                                                        <div className="spinner-border spinner-border-sm" />
                                                                    ) : (
                                                                        <><CheckCircle size={18} /> Accept</>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(appt.id, "Rejected")}
                                                                    disabled={isProcessing}
                                                                    className="btn flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                                                                    style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "none" }}
                                                                >
                                                                    {isProcessing ? (
                                                                        <div className="spinner-border spinner-border-sm" />
                                                                    ) : (
                                                                        <><XCircle size={18} /> Reject</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {appt.status === "Booked" && (
                                                            <div className="mt-3">
                                                                <button
                                                                    onClick={() => handleAction(appt.id, "Completed")}
                                                                    disabled={isProcessing}
                                                                    className="btn fw-bold py-2 px-4 rounded-3 d-flex align-items-center gap-2"
                                                                    style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1", border: "none" }}
                                                                >
                                                                    {isProcessing ? (
                                                                        <div className="spinner-border spinner-border-sm" />
                                                                    ) : (
                                                                        <><CheckCircle size={16} /> Mark as Completed</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {appt.status === "Completed" && (
                                                            <div className="mt-3">
                                                                <button
                                                                    onClick={() => router.push('/records')}
                                                                    className="btn fw-bold py-2 px-4 rounded-3 d-flex align-items-center gap-2"
                                                                    style={{ background: "rgba(70,194,222,0.1)", color: "#46C2DE", border: "none" }}
                                                                >
                                                                    <Upload size={16} /> Upload Patient Report
                                                                </button>
                                                            </div>
                                                        )}

                                                        {appt.status === "Accepted" && (
                                                            <div className="mt-3 px-3 py-2 rounded-3 bg-light-info d-flex align-items-center gap-2 border border-info border-opacity-10">
                                                                <AlertCircle size={14} className="text-info" />
                                                                <span className="smallest fw-bold text-dark">Waiting for patient payment...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                .btn-light-primary { background: rgba(70, 194, 222, 0.1); color: #46C2DE; border: none; }
                .btn-light-primary:hover { background: rgba(70, 194, 222, 0.2); }
            `}</style>
        </div>
    );
}
