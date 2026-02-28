"use client";

import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";
import {
    Phone, MapPin, Edit3, Activity, Award, CheckCircle,
    Camera, Shield, Zap, User, Stethoscope, Clock, Star,
    BookOpen, Save, X
} from "lucide-react";
import LoadingOverlay from "../../components/LoadingOverlay";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import AxiosInstance from "@/lib/AxiosInstance";
import { showError, showSuccess } from "@/lib/alerts";
import NextImage from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
    name: string;
    email: string;
    mobile: string;
    location: string;
    username: string;
    profile_photo: string;
    is_doctor?: boolean;
    doctor_id?: number;
}

interface DoctorData {
    id: number;
    name: string;
    specialization: number;
    specialization_name: string;
    experience: number;
    rating: number;
    reviews_count: number;
    about: string;
    image_url: string;
    availability_time: string;
    location: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDoctorEditModal, setShowDoctorEditModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [userData, setUserData] = useState<UserData>({
        name: "Syncing...", email: "", mobile: "", location: "", username: "", profile_photo: ""
    });
    const [editForm, setEditForm] = useState({ name: "", mobile: "", location: "", profile_photo: "" });

    const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
    const [doctorEditForm, setDoctorEditForm] = useState<any>({
        experience: 0, about: "", availability_time: "", location: "", image_url: "", name: "", specialization: 0
    });

    const [specializations, setSpecializations] = useState<any[]>([]);

    const fetchSpecializations = async () => {
        try {
            const res = await AxiosInstance.get("specializations/");
            setSpecializations(res.data);
        } catch { }
    };

    const isDoctor = userData.is_doctor === true;

    // ─── Fetch ─────────────────────────────────────────────────────────────────

    const fetchProfile = async () => {
        try {
            const res = await AxiosInstance.get("profile/");
            setUserData(res.data);
            setEditForm({ name: res.data.name, mobile: res.data.mobile, location: res.data.location, profile_photo: res.data.profile_photo || "" });
            localStorage.setItem("user_name", res.data.name);
        } catch {
            showError("Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctorProfile = async () => {
        try {
            const res = await AxiosInstance.get("doctor-profile/");
            const info: DoctorData = Array.isArray(res.data) ? res.data[0] : res.data;
            setDoctorData(info);
            setDoctorEditForm({
                experience: info.experience,
                about: info.about,
                availability_time: info.availability_time,
                location: info.location,
                image_url: info.image_url,
                name: info.name,
                specialization: info.specialization
            });
        } catch {
            // not a doctor or no data yet
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchSpecializations();
    }, []);

    useEffect(() => {
        if (userData.is_doctor) fetchDoctorProfile();
    }, [userData.is_doctor]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleUpdate = async (formData = editForm) => {
        setIsUpdating(true);
        try {
            await AxiosInstance.post("profile/update_profile/", formData);
            showSuccess("Profile updated successfully!");
            setShowEditModal(false);
            fetchProfile();
            if (isDoctor) fetchDoctorProfile();
        } catch (err: any) {
            showError(err.response?.data?.error || "Update failed.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDoctorUpdate = async () => {
        setIsUpdating(true);
        try {
            await AxiosInstance.patch("doctor-profile/update_info/", doctorEditForm);
            showSuccess("Doctor profile updated!");
            setShowDoctorEditModal(false);
            fetchDoctorProfile();
            fetchProfile(); // Refresh main profile as well for name
        } catch (err: any) {
            showError(err.response?.data?.error || "Update failed.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showError("File size exceeds 2MB limit."); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const b64 = reader.result as string;
            const updated = { ...editForm, profile_photo: b64 };
            setEditForm(updated);
            setUserData(prev => ({ ...prev, profile_photo: b64 }));
            handleUpdate(updated);
        };
        reader.readAsDataURL(file);
    };

    const getInitials = (name: string) =>
        name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    const DOCTOR_COLOR = "#10B981";
    const PATIENT_COLOR = "#46C2DE";
    const accentColor = isDoctor ? DOCTOR_COLOR : PATIENT_COLOR;

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>{loading && <LoadingOverlay />}</AnimatePresence>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title={isDoctor ? "Doctor Profile" : "My Profile"} onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    <div className="container-fluid p-0">

                        {/* ── Hero Card ─────────────────────────────────────── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white overflow-hidden mb-5 shadow-sm"
                            style={{ borderRadius: "32px", border: "1px solid #F1F5F9" }}>

                            {/* Banner */}
                            <div style={{
                                height: "180px",
                                background: isDoctor
                                    ? "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)"
                                    : "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                                position: "relative"
                            }}>
                                {isDoctor && (
                                    <div className="position-absolute top-0 end-0 m-4">
                                        <span className="badge rounded-pill px-3 py-2 fw-bold"
                                            style={{ background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                                            <Stethoscope size={14} className="me-1" />
                                            {doctorData?.specialization_name || "Doctor"}
                                        </span>
                                    </div>
                                )}
                                <div className="position-absolute bottom-0 start-0 w-100 h-100"
                                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)" }} />
                            </div>

                            <div className="px-4 px-xl-5 pb-5">
                                <div className="d-flex align-items-end justify-content-between flex-wrap gap-3" style={{ marginTop: "-60px" }}>
                                    {/* Avatar */}
                                    <div className="position-relative">
                                        <div className="bg-white rounded-circle p-1 shadow-lg">
                                            <div className="rounded-circle overflow-hidden" style={{ width: "120px", height: "120px", border: `4px solid ${accentColor}` }}>
                                                {userData.profile_photo ? (
                                                    <NextImage src={userData.profile_photo} alt={userData.name} fill unoptimized className="object-cover" />
                                                ) : (
                                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center outfit fw-bold display-5"
                                                        style={{ background: `${accentColor}20`, color: accentColor }}>
                                                        {getInitials(userData.name)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()}
                                            className="btn rounded-circle position-absolute bottom-0 end-0 p-2 shadow border border-white border-2"
                                            style={{ width: "40px", height: "40px", background: accentColor }}>
                                            <Camera size={18} color="white" />
                                        </button>
                                        <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                                    </div>

                                    {/* Name + role */}
                                    <div className="flex-grow-1 pt-3">
                                        <h1 className="outfit fw-bold text-dark mb-1" style={{ fontSize: "1.75rem" }}>
                                            {isDoctor ? "Dr. " : ""}{userData.name}
                                        </h1>
                                        <div className="d-flex align-items-center gap-3 flex-wrap">
                                            <span className="badge rounded-pill px-3 py-1 fw-bold smallest uppercase tracking-widest d-inline-flex align-items-center gap-1"
                                                style={{ background: `${accentColor}15`, color: accentColor }}>
                                                {isDoctor ? <><Stethoscope size={12} /> {doctorData?.specialization_name || "Specialist"}</> : "Premium Patient"}
                                            </span>
                                            <span className="text-muted small d-flex align-items-center gap-1">
                                                <MapPin size={13} /> {userData.location}
                                            </span>
                                            {isDoctor && doctorData && (
                                                <span className="d-flex align-items-center gap-1 text-muted small">
                                                    <Star size={13} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                                                    <span className="fw-bold" style={{ color: "#F59E0B" }}>{doctorData.rating}</span>
                                                    <span>({doctorData.reviews_count} reviews)</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Edit buttons */}
                                    <div className="d-flex gap-2">
                                        <button onClick={() => setShowEditModal(true)}
                                            className="btn fw-bold px-4 py-2 d-flex align-items-center gap-2 rounded-3"
                                            style={{ background: `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                                            <Edit3 size={16} /> Edit Profile
                                        </button>
                                        {isDoctor && (
                                            <button onClick={() => setShowDoctorEditModal(true)}
                                                className="btn fw-bold px-4 py-2 d-flex align-items-center gap-2 rounded-3"
                                                style={{ background: `${DOCTOR_COLOR}`, color: "white", border: "none", boxShadow: `0 4px 15px ${DOCTOR_COLOR}40` }}>
                                                <Stethoscope size={16} /> Edit Medical Info
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Info grid */}
                                <div className="row g-3 mt-4">
                                    <div className="col-12 col-md-4">
                                        <InfoCard icon={<User size={18} />} label="Full Name" value={userData.name} color={accentColor} />
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <InfoCard icon={<Phone size={18} />} label="Connected Number" value={userData.mobile} color={accentColor} />
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <InfoCard icon={<MapPin size={18} />} label="Hometown / Area" value={userData.location} color={accentColor} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Doctor Medical Info Section ────────────────────── */}
                        {isDoctor && doctorData && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="mb-5">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <Stethoscope size={20} style={{ color: DOCTOR_COLOR }} />
                                    <h5 className="outfit fw-bold m-0 text-dark">Medical Information</h5>
                                </div>
                                <div className="row g-4">
                                    {/* Stats row */}
                                    <div className="col-12 col-md-4">
                                        <motion.div whileHover={{ scale: 1.02, translateY: -5 }} className="bg-white rounded-4 p-4 shadow-sm h-100 transition-all border-hover"
                                            style={{ border: "1.5px solid #F1F5F9" }}>
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div className="p-2 rounded-3" style={{ background: `${DOCTOR_COLOR}15` }}>
                                                    <Award size={18} style={{ color: DOCTOR_COLOR }} />
                                                </div>
                                                <span className="smallest fw-bold text-muted uppercase tracking-widest">Medical Specialty</span>
                                            </div>
                                            <p className="fw-bold text-dark outfit fs-5 m-0">{doctorData.specialization_name}</p>
                                        </motion.div>
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <motion.div whileHover={{ scale: 1.02, translateY: -5 }} className="bg-white rounded-4 p-4 shadow-sm h-100 transition-all border-hover"
                                            style={{ border: "1.5px solid #F1F5F9" }}>
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div className="p-2 rounded-3" style={{ background: "#F59E0B15" }}>
                                                    <Activity size={18} style={{ color: "#F59E0B" }} />
                                                </div>
                                                <span className="smallest fw-bold text-muted uppercase tracking-widest">Clinical Experience</span>
                                            </div>
                                            <p className="fw-bold text-dark outfit fs-5 m-0">{doctorData.experience} Years</p>
                                        </motion.div>
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <motion.div whileHover={{ scale: 1.02, translateY: -5 }} className="bg-white rounded-4 p-4 shadow-sm h-100 transition-all border-hover"
                                            style={{ border: "1.5px solid #F1F5F9" }}>
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div className="p-2 rounded-3" style={{ background: "#46C2DE15" }}>
                                                    <Clock size={18} style={{ color: "#46C2DE" }} />
                                                </div>
                                                <span className="smallest fw-bold text-muted uppercase tracking-widest">Available Hours</span>
                                            </div>
                                            <p className="fw-bold text-dark outfit fs-5 m-0">{doctorData.availability_time}</p>
                                        </motion.div>
                                    </div>

                                    {/* About / Bio */}
                                    {doctorData.about && (
                                        <div className="col-12">
                                            <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-4 p-4 shadow-sm transition-all border-hover"
                                                style={{ border: "1.5px solid #F1F5F9" }}>
                                                <div className="d-flex align-items-center gap-3 mb-3">
                                                    <div className="p-2 rounded-3" style={{ background: `${DOCTOR_COLOR}15` }}>
                                                        <BookOpen size={18} style={{ color: DOCTOR_COLOR }} />
                                                    </div>
                                                    <span className="smallest fw-bold text-muted uppercase tracking-widest">Professional Bio</span>
                                                </div>
                                                <p className="text-dark m-0 pb-2" style={{ lineHeight: 1.8, color: "#334155", fontSize: "0.95rem" }}>{doctorData.about}</p>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ── Patient Widgets / Doctor Status ───────────────── */}
                        <div className="row g-4">
                            <div className="col-12 col-lg-6">
                                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-4 p-4 shadow-sm h-100"
                                    style={{ border: "1px solid #F1F5F9" }}>
                                    <div className="d-flex align-items-center justify-content-between mb-4">
                                        <h5 className="fw-bold m-0 outfit">{isDoctor ? "Account Activity" : "Account Audit Log"}</h5>
                                        <span className="smallest fw-bold uppercase tracking-widest" style={{ color: accentColor }}>Live</span>
                                    </div>
                                    <div className="d-flex flex-column gap-3">
                                        {[
                                            { action: "Profile Synchronized", time: "Just now", icon: Zap, color: "#F59E0B" },
                                            { action: "Photo Updated", time: "Recently", icon: Camera, color: DOCTOR_COLOR },
                                            { action: "Security Verified", time: "Today", icon: Shield, color: accentColor },
                                        ].map((log, i) => (
                                            <div key={i} className="d-flex align-items-center justify-content-between p-3 rounded-4"
                                                style={{ background: "#F8FAFC" }}>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="p-2 rounded-3 bg-white shadow-sm">
                                                        <log.icon size={16} style={{ color: log.color }} />
                                                    </div>
                                                    <span className="small fw-bold text-dark">{log.action}</span>
                                                </div>
                                                <span className="smallest text-muted">{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            <div className="col-12 col-lg-6">
                                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-4 p-4 shadow-sm h-100"
                                    style={{ border: "1px solid #F1F5F9" }}>
                                    <h5 className="fw-bold mb-4 outfit">Security Status</h5>
                                    <div className="p-4 rounded-4"
                                        style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="p-2 bg-white rounded-circle shadow-sm">
                                                <Shield size={20} style={{ color: accentColor }} />
                                            </div>
                                            <div>
                                                <div className="small fw-bold text-dark">Verified Session</div>
                                                <div className="smallest text-muted">End-to-end encrypted connection.</div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 fw-bold smallest uppercase tracking-widest"
                                            style={{ color: DOCTOR_COLOR }}>
                                            <CheckCircle size={14} /> System Status: Operational
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* ── Edit Profile Modal ────────────────────────────────────────── */}
            <AnimatePresence>
                {showEditModal && (
                    <ModalWrapper onClose={() => setShowEditModal(false)}>
                        <div className="text-center mb-4">
                            <div className="d-inline-block p-3 rounded-circle mb-3" style={{ background: `${accentColor}15` }}>
                                <Edit3 size={28} style={{ color: accentColor }} />
                            </div>
                            <h4 className="fw-bold outfit text-dark mb-1">Edit Profile</h4>
                            <p className="text-muted small">Update your personal information</p>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); handleUpdate(); }}>
                            <FormField label="Display Name">
                                <input type="text" className="form-control-premium w-100"
                                    value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                            </FormField>
                            <FormField label="Mobile">
                                <input type="tel" className="form-control-premium w-100"
                                    value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} required />
                            </FormField>
                            <FormField label="Location">
                                <input type="text" className="form-control-premium w-100"
                                    value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                            </FormField>
                            <ModalActions loading={isUpdating} color={accentColor} onCancel={() => setShowEditModal(false)} label="Save Changes" />
                        </form>
                    </ModalWrapper>
                )}
            </AnimatePresence>

            {/* ── Edit Doctor Info Modal ───────────────────────────────────── */}
            <AnimatePresence>
                {showDoctorEditModal && (
                    <ModalWrapper onClose={() => setShowDoctorEditModal(false)}>
                        <div className="text-center mb-4">
                            <div className="d-inline-block p-3 rounded-circle mb-3" style={{ background: `${DOCTOR_COLOR}15` }}>
                                <Stethoscope size={28} style={{ color: DOCTOR_COLOR }} />
                            </div>
                            <h4 className="fw-bold outfit text-dark mb-1">Edit Medical Info</h4>
                            <p className="text-muted small">Update your professional information visible to patients</p>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); handleDoctorUpdate(); }}>
                            <FormField label="Professional Name">
                                <input type="text" className="form-control-premium w-100"
                                    value={doctorEditForm.name}
                                    onChange={e => setDoctorEditForm({ ...doctorEditForm, name: e.target.value })} required />
                            </FormField>
                            <FormField label="Medical Specialization">
                                <select className="form-select form-control-premium w-100"
                                    value={doctorEditForm.specialization}
                                    style={{ appearance: "auto" }}
                                    onChange={e => setDoctorEditForm({ ...doctorEditForm, specialization: Number(e.target.value) })}>
                                    <option value="" disabled>Select area...</option>
                                    {specializations.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Years of Experience">
                                <input type="number" min={0} max={60} className="form-control-premium w-100"
                                    value={doctorEditForm.experience}
                                    onChange={e => setDoctorEditForm({ ...doctorEditForm, experience: Number(e.target.value) })} />
                            </FormField>
                            <FormField label="Availability Hours (e.g. 9 AM – 5 PM)">
                                <input type="text" className="form-control-premium w-100"
                                    placeholder="10 AM - 5 PM"
                                    value={doctorEditForm.availability_time}
                                    onChange={e => setDoctorEditForm({ ...doctorEditForm, availability_time: e.target.value })} />
                            </FormField>
                            <FormField label="Clinic / Hospital Location">
                                <input type="text" className="form-control-premium w-100"
                                    placeholder="City, Clinic Name"
                                    value={doctorEditForm.location}
                                    onChange={e => setDoctorEditForm({ ...doctorEditForm, location: e.target.value })} />
                            </FormField>
                            <FormField label="Profile Image URL (optional)">
                                <input type="url" className="form-control-premium w-100"
                                    placeholder="https://..."
                                    value={doctorEditForm.image_url}
                                    onChange={e => setDoctorEditForm({ ...doctorEditForm, image_url: e.target.value })} />
                            </FormField>
                            <FormField label="About / Bio">
                                <textarea className="form-control-premium w-100" rows={4}
                                    placeholder="Describe your expertise, approach, and background..."
                                    value={doctorEditForm.about}
                                    onChange={e => setDoctorEditForm({ ...doctorEditForm, about: e.target.value })}
                                    style={{ resize: "none" }} />
                            </FormField>
                            <ModalActions loading={isUpdating} color={DOCTOR_COLOR} onCancel={() => setShowDoctorEditModal(false)} label="Save Medical Info" />
                        </form>
                    </ModalWrapper>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <motion.div whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}
            className="p-4 rounded-4 h-100 transition-all border-hover"
            style={{ border: "1.5px solid #F1F5F9", background: "white" }}>
            <div className="d-flex align-items-center gap-3 mb-2">
                <div className="p-2 rounded-3" style={{ background: `${color}15`, color }}>{icon}</div>
                <span className="smallest fw-bold text-muted uppercase tracking-widest">{label}</span>
            </div>
            <p className="fw-bold text-dark m-0 fs-5 outfit">{value || "—"}</p>
        </motion.div>
    );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 1050 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="bg-white rounded-5 p-4 p-lg-5 shadow-lg w-100 mx-3 overflow-y-auto"
                style={{ maxWidth: "520px", maxHeight: "90vh" }}>
                {children}
            </motion.div>
        </motion.div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <label className="form-label smallest fw-bold text-muted uppercase tracking-widest mb-2">{label}</label>
            {children}
        </div>
    );
}

function ModalActions({ loading, color, onCancel, label }: { loading: boolean; color: string; onCancel: () => void; label: string }) {
    return (
        <div className="d-flex gap-3 mt-4">
            <button type="button" onClick={onCancel} disabled={loading}
                className="btn btn-light flex-grow-1 py-3 rounded-pill fw-bold border-0 d-flex align-items-center justify-content-center gap-2">
                <X size={16} /> Cancel
            </button>
            <button type="submit" disabled={loading}
                className="btn flex-grow-1 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{ background: color, color: "white", borderRadius: "50px", border: "none", boxShadow: `0 6px 20px ${color}40` }}>
                {loading ? <div className="spinner-border spinner-border-sm" role="status" /> : <><Save size={16} /> {label}</>}
            </button>
        </div>
    );
}
