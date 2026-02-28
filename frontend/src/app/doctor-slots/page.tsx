"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, Clock, Plus, Trash2, Save, Send,
    CheckCircle2, AlertCircle, X, ChevronRight,
    Sun, Sunrise, Sunset, Activity, Info, Pencil, Check
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";
import LoadingOverlay from "@/components/LoadingOverlay";
import AxiosInstance from "@/lib/AxiosInstance";
import { showSuccess, showError, showConfirm } from "@/lib/alerts";
import { useRouter } from "next/navigation";

interface Slot {
    id: number;
    time: string;
    shift: "Morning" | "Afternoon" | "Evening";
    is_booked: boolean;
}

export default function ManageShiftsPage() {
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [newSlot, setNewSlot] = useState<{ time: string, shift: "Morning" | "Afternoon" | "Evening" }>({ time: "", shift: "Morning" });
    const [isAdding, setIsAdding] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ time: string, shift: "Morning" | "Afternoon" | "Evening" }>({ time: "", shift: "Morning" });
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const [newTime, setNewTime] = useState({ h: "09", m: "00", p: "AM" });
    const [editTime, setEditTime] = useState({ h: "09", m: "00", p: "AM" });

    const formatTo12h = (t: { h: string, m: string, p: string }) => `${t.h}:${t.m} ${t.p}`;

    const parseFrom12h = (s: string) => {
        if (!s || !s.includes(" ") || !s.includes(":")) return { h: "09", m: "00", p: "AM" };
        const [time, p] = s.split(" ");
        const [h, m] = time.split(":");
        return { h, m, p: p as "AM" | "PM" };
    };

    useEffect(() => {
        const role = localStorage.getItem("user_role");
        if (role !== "doctor") {
            router.push("/home");
            return;
        }
        fetchSlots();
    }, [router]);

    const fetchSlots = async () => {
        try {
            const res = await AxiosInstance.get("doctor-slots/");
            setSlots(res.data);
        } catch (err) {
            showError("Failed to load shifts");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        const timeStr = formatTo12h(newTime);

        setIsAdding(true);
        try {
            const payload = { ...newSlot, time: timeStr };
            await AxiosInstance.post("doctor-slots/", payload);
            showSuccess(`Added ${timeStr} to your ${newSlot.shift} shift`);
            fetchSlots();
        } catch (err) {
            showError("Failed to add slot");
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditClick = (slot: Slot) => {
        setEditingSlotId(slot.id);
        setEditTime(parseFrom12h(slot.time));
    };

    const handleUpdateSlot = async (id: number) => {
        const timeStr = formatTo12h(editTime);
        setIsUpdating(true);
        try {
            const payload = { ...editForm, time: timeStr };
            await AxiosInstance.patch(`doctor-slots/${id}/`, payload);
            showSuccess("Shift updated successfully");
            setEditingSlotId(null);
            fetchSlots();
        } catch (err) {
            showError("Failed to update shift");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteSlot = async (id: number) => {
        const result = await showConfirm("Delete Slot?", "This shift will no longer be available for patient bookings.");
        if (result.isConfirmed) {
            try {
                await AxiosInstance.delete(`doctor-slots/${id}/`);
                setSlots(slots.filter(s => s.id !== id));
                showSuccess("Shift removed successfully");
            } catch (err) {
                showError("Cannot delete a booked shift");
            }
        }
    };

    const shifts = {
        Morning: slots.filter(s => s.shift === "Morning"),
        Afternoon: slots.filter(s => s.shift === "Afternoon"),
        Evening: slots.filter(s => s.shift === "Evening"),
    };

    const shiftTones = {
        Morning: { color: "#F59E0B", gradient: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)", icon: Sunrise },
        Afternoon: { color: "#10B981", gradient: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)", icon: Sun },
        Evening: { color: "#8B5CF6", gradient: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", icon: Sunset },
    };

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>{loading && <LoadingOverlay />}</AnimatePresence>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="Manage Work Shifts" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    <div className="container-fluid p-0">

                        {/* Summary Header */}
                        <div className="row g-4 mb-5">
                            <div className="col-12 col-xl-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white rounded-5 p-4 p-lg-5 shadow-sm overflow-hidden position-relative border-hover"
                                    style={{ border: "1.5px solid #F1F5F9" }}
                                >
                                    <div className="position-absolute" style={{ top: -20, right: -20, opacity: 0.05 }}>
                                        <Calendar size={180} />
                                    </div>
                                    <div className="position-relative">
                                        <h2 className="outfit fw-bold text-dark mb-2">Configure Your Practice Availability</h2>
                                        <p className="text-muted fs-5 mb-0" style={{ maxWidth: "600px" }}>
                                            Define the time slots available for patients. You can categorize them by different shifts to manage your daily schedule efficiently.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                            <div className="col-12 col-xl-4 text-center">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="h-100 p-4 rounded-5 d-flex flex-column align-items-center justify-content-center border-hover"
                                    style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", color: "white" }}
                                >
                                    <div className="smallest fw-bold text-white-50 uppercase tracking-widest mb-3">Total Active Slots</div>
                                    <div className="display-4 fw-bold outfit text-primary-light mb-1">{slots.length}</div>
                                    <div className="small text-white-50">Across all shift categories</div>
                                </motion.div>
                            </div>
                        </div>

                        <div className="row g-4 mb-5">
                            {/* Create New Slot Form */}
                            <div className="col-12 col-lg-5 col-xl-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-5 p-4 p-xl-5 shadow-sm sticky-top"
                                    style={{ top: "2rem", border: "1.5px solid #F1F5F9" }}
                                >
                                    <div className="d-flex align-items-center gap-3 mb-4">
                                        <div className="p-3 bg-primary-light text-primary rounded-4">
                                            <Plus size={24} />
                                        </div>
                                        <h4 className="fw-bold m-0 outfit text-dark">Quick Add Slot</h4>
                                    </div>

                                    <form onSubmit={handleAddSlot}>
                                        <div className="mb-4">
                                            <label className="form-label smallest fw-bold text-muted uppercase tracking-widest mb-2">Shift Category</label>
                                            <div className="d-flex gap-2 flex-wrap">
                                                {(["Morning", "Afternoon", "Evening"] as const).map((s: "Morning" | "Afternoon" | "Evening") => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setNewSlot({ ...newSlot, shift: s })}
                                                        className={`btn flex-grow-1 py-2 rounded-3 fw-bold border-0 transition-all ${newSlot.shift === s ? 'shadow-sm' : 'opacity-60'}`}
                                                        style={{
                                                            background: newSlot.shift === s ? (shiftTones as any)[s].color : "#F1F5F9",
                                                            color: newSlot.shift === s ? "white" : "#64748B"
                                                        }}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label smallest fw-bold text-muted uppercase tracking-widest mb-2">Target Time (12h)</label>
                                            <div className="d-flex align-items-center gap-2 p-3 rounded-4 bg-light shadow-sm">
                                                <div className="text-primary me-2"><Clock size={20} /></div>
                                                <select
                                                    className="form-select border-0 bg-transparent fw-bold outfit fs-5"
                                                    value={newTime.h}
                                                    onChange={e => setNewTime({ ...newTime, h: e.target.value })}
                                                    style={{ width: 'auto', cursor: 'pointer' }}
                                                >
                                                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                                <span className="fw-bold fs-5">:</span>
                                                <select
                                                    className="form-select border-0 bg-transparent fw-bold outfit fs-5"
                                                    value={newTime.m}
                                                    onChange={e => setNewTime({ ...newTime, m: e.target.value })}
                                                    style={{ width: 'auto', cursor: 'pointer' }}
                                                >
                                                    {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                                <div className="btn-group ms-auto rounded-3 overflow-hidden" style={{ border: '1.5px solid #E2E8F0' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewTime({ ...newTime, p: 'AM' })}
                                                        className={`btn btn-sm px-3 fw-bold border-0 ${newTime.p === 'AM' ? 'btn-primary' : 'btn-light text-muted'}`}
                                                    >AM</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewTime({ ...newTime, p: 'PM' })}
                                                        className={`btn btn-sm px-3 fw-bold border-0 ${newTime.p === 'PM' ? 'btn-primary' : 'btn-light text-muted'}`}
                                                    >PM</button>
                                                </div>
                                            </div>
                                            <div className="small text-muted mt-2 d-flex align-items-center gap-1 px-1">
                                                <Info size={14} /> <span>Selected: {formatTo12h(newTime)}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isAdding}
                                            className="btn btn-primary w-100 py-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg"
                                        >
                                            {isAdding ? <div className="spinner-border spinner-border-sm" /> : <><Save size={18} /> Publish Slot</>}
                                        </button>
                                    </form>

                                    <div className="mt-5 p-4 rounded-4 bg-light shadow-inner">
                                        <div className="d-flex align-items-center gap-2 mb-2 text-primary">
                                            <AlertCircle size={16} />
                                            <span className="smallest fw-bold uppercase tracking-widest">Auto-Categorization</span>
                                        </div>
                                        <p className="smallest text-muted m-0" style={{ lineHeight: 1.6 }}>
                                            Selecting a shift category helps organize your public profile, making it easier for patients to find preferred times.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Slots Display */}
                            <div className="col-12 col-lg-7 col-xl-8">
                                <div className="d-flex flex-column gap-5">
                                    {(["Morning", "Afternoon", "Evening"] as const).map((shiftType, idx) => (
                                        <motion.div
                                            key={shiftType}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <div className="d-flex align-items-center justify-content-between mb-4 px-2">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="p-2 rounded-3" style={{ background: `${(shiftTones as any)[shiftType].color}15`, color: (shiftTones as any)[shiftType].color }}>
                                                        {(() => {
                                                            const Icon = (shiftTones as any)[shiftType].icon;
                                                            return <Icon size={24} />;
                                                        })()}
                                                    </div>
                                                    <div>
                                                        <h4 className="fw-bold m-0 outfit text-dark">{shiftType} Shift</h4>
                                                        <div className="text-muted smallest fw-bold uppercase tracking-widest">{shifts[shiftType].length} Slots Defined</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="row g-3">
                                                <AnimatePresence mode="popLayout">
                                                    {shifts[shiftType].length === 0 ? (
                                                        <div className="col-12">
                                                            <div className="p-5 rounded-5 border-dashed text-center text-muted">
                                                                <Clock size={32} className="mb-2 opacity-20" />
                                                                <p className="small m-0">No slots defined for this shift period.</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        shifts[shiftType].map(slot => (
                                                            <div key={slot.id} className="col-12 col-sm-6 col-xl-4">
                                                                <motion.div
                                                                    layout
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                                    whileHover={{ y: -4 }}
                                                                    className="bg-white rounded-4 p-3 shadow-sm d-flex align-items-center justify-content-between border-hover transition-all"
                                                                    style={{
                                                                        border: slot.is_booked ? "1.5px solid #10B98130" : "1.5px solid #F1F5F9",
                                                                        background: slot.is_booked ? "#F0FDF4" : "white"
                                                                    }}
                                                                >
                                                                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                                                                        <div className={`p-2 rounded-circle ${slot.is_booked ? 'bg-success text-white' : 'bg-light text-muted'}`}>
                                                                            <Clock size={16} />
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            {editingSlotId === slot.id ? (
                                                                                <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-3">
                                                                                    <select
                                                                                        className="form-select form-select-sm border-0 bg-transparent fw-bold"
                                                                                        value={editTime.h}
                                                                                        onChange={e => setEditTime({ ...editTime, h: e.target.value })}
                                                                                        style={{ width: '45px', padding: '0 5px' }}
                                                                                    >
                                                                                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(v => (
                                                                                            <option key={v} value={v}>{v}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <span className="fw-bold">:</span>
                                                                                    <select
                                                                                        className="form-select form-select-sm border-0 bg-transparent fw-bold"
                                                                                        value={editTime.m}
                                                                                        onChange={e => setEditTime({ ...editTime, m: e.target.value })}
                                                                                        style={{ width: '45px', padding: '0 5px' }}
                                                                                    >
                                                                                        {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(v => (
                                                                                            <option key={v} value={v}>{v}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setEditTime({ ...editTime, p: editTime.p === 'AM' ? 'PM' : 'AM' })}
                                                                                        className="btn btn-xs btn-primary rounded-2 px-2 py-0 fw-bold smallest"
                                                                                        style={{ fontSize: '10px', height: '24px' }}
                                                                                    >
                                                                                        {editTime.p}
                                                                                    </button>
                                                                                    <div className="d-flex gap-1 ms-1">
                                                                                        <button
                                                                                            disabled={isUpdating}
                                                                                            onClick={() => handleUpdateSlot(slot.id)}
                                                                                            className="btn btn-primary btn-sm rounded-circle p-1"
                                                                                        >
                                                                                            {isUpdating ? <span className="spinner-border spinner-border-sm" /> : <Check size={14} />}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => setEditingSlotId(null)}
                                                                                            className="btn btn-light btn-sm rounded-circle p-1"
                                                                                        >
                                                                                            <X size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="fw-bold text-dark outfit fs-5">{slot.time}</div>
                                                                                    {slot.is_booked && (
                                                                                        <div className="smallest fw-bold text-success uppercase tracking-widest d-flex align-items-center gap-1">
                                                                                            <CheckCircle2 size={10} /> Booked
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {!slot.is_booked && editingSlotId !== slot.id && (
                                                                        <div className="d-flex gap-1">
                                                                            <button
                                                                                onClick={() => handleEditClick(slot)}
                                                                                className="btn btn-light-primary rounded-circle p-2 border-0 shadow-sm"
                                                                                title="Edit Slot"
                                                                            >
                                                                                <Pencil size={15} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteSlot(slot.id)}
                                                                                className="btn btn-light-danger rounded-circle p-2 border-0 shadow-sm"
                                                                                title="Remove Slot"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            </div>
                                                        ))
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            <style jsx global>{`
                .border-dashed { border: 2px dashed #E2E8F0; }
                .border-hover { transition: all 0.3s ease; }
                .border-hover:hover { border-color: #46C2DE !important; }
                .bg-primary-light { background: rgba(70, 194, 222, 0.1); }
                .text-primary-light { color: #8EDEF2; }
                .btn-light-danger { background: #fee2e2; color: #ef4444; }
                .btn-light-danger:hover { background: #fecaca; color: #dc2626; }
                .btn-light-primary { background: #E0F2FE; color: #0EA5E9; }
                .btn-light-primary:hover { background: #BAE6FD; color: #0284C7; }
                .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); }
            `}</style>
        </div>
    );
}
