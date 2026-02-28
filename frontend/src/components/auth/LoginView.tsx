"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight, Eye, EyeOff, Lock, Smartphone, User, UserPlus,
    Stethoscope, Heart, KeyRound, ChevronDown, CheckCircle, MapPin, Briefcase, ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import AxiosInstance from "@/lib/AxiosInstance";
import { showError, showSuccess } from "@/lib/alerts";
import { useRouter } from "next/navigation";

interface LoginViewProps {
    mobile: string;
    setMobile: (val: string) => void;
    onNext: () => void;
    onCredentialsLogin: (id: string, pass: string) => void;
    onSignup: (username: string, mobile: string, pass: string) => void;
    loading?: boolean;
}

type RoleTab = "patient" | "doctor";
type AuthTab = "login" | "signup";

interface Specialization {
    id: number;
    name: string;
}

export default function LoginView({
    mobile,
    setMobile,
    onNext,
    onCredentialsLogin,
    onSignup,
    loading,
}: LoginViewProps) {
    const router = useRouter();
    const [role, setRole] = useState<RoleTab>("patient");
    const [authTab, setAuthTab] = useState<AuthTab>("login");

    // Patient login
    const [patientId, setPatientId] = useState("");
    const [patientPass, setPatientPass] = useState("");
    const [showPatientPass, setShowPatientPass] = useState(false);
    const [useOtp, setUseOtp] = useState(false);

    // Patient signup
    const [signupUsername, setSignupUsername] = useState("");
    const [signupPass, setSignupPass] = useState("");
    const [showSignupPass, setShowSignupPass] = useState(false);

    // Doctor login
    const [doctorId, setDoctorId] = useState("");
    const [doctorPass, setDoctorPass] = useState("");
    const [showDoctorPass, setShowDoctorPass] = useState(false);

    // Doctor signup
    const [docName, setDocName] = useState("");
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [selectedSpec, setSelectedSpec] = useState<Specialization | null>(null);
    const [docUsername, setDocUsername] = useState("");
    const [docPass, setDocPass] = useState("");
    const [showDocPass, setShowDocPass] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [docSignupLoading, setDocSignupLoading] = useState(false);

    const PATIENT_COLOR = "#46C2DE";
    const DOCTOR_COLOR = "#10B981";
    const activeColor = role === "patient" ? PATIENT_COLOR : DOCTOR_COLOR;

    useEffect(() => {
        if (role === "doctor" && authTab === "signup") {
            AxiosInstance.get("specializations/")
                .then(res => setSpecializations(res.data))
                .catch(() => { });
        }
    }, [role, authTab]);

    const handleRoleChange = (r: RoleTab) => {
        setRole(r);
        setAuthTab("login");
        setUseOtp(false);
    };

    const handleDoctorSignup = async () => {
        if (!docName || !selectedSpec || !docUsername || !docPass) {
            showError("Please fill all fields.");
            return;
        }
        setDocSignupLoading(true);
        try {
            const res = await AxiosInstance.post("doctor-register/", {
                username: docUsername,
                password: docPass,
                name: docName,
                specialization_id: selectedSpec.id,
            });
            localStorage.setItem("access_token", res.data.access);
            localStorage.setItem("refresh_token", res.data.refresh);
            localStorage.setItem("user_name", res.data.user.name);
            localStorage.setItem("user_role", "doctor");
            localStorage.setItem("doctor_id", String(res.data.user.doctor_id));
            showSuccess(`Welcome, Dr. ${res.data.user.name}! Your account is ready.`);
            setTimeout(() => router.push("/doctor-dashboard"), 1500);
        } catch (err: any) {
            showError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setDocSignupLoading(false);
        }
    };

    // ─── Patient Login ────────────────────────────────────────────────────────
    const renderPatientLogin = () => (
        <motion.div key="pl" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="pt-2">
            <div className="d-flex gap-2 mb-4 p-1 rounded-4 bg-light shadow-sm">
                {([{ k: false, icon: <Lock size={14} />, label: "Password" }, { k: true, icon: <Smartphone size={14} />, label: "OTP" }] as const).map(opt => (
                    <button key={String(opt.k)} onClick={() => setUseOtp(opt.k as boolean)}
                        className="flex-grow-1 btn btn-sm py-2 rounded-3 fw-bold border-0 d-flex align-items-center justify-content-center gap-2 transition-all"
                        style={{
                            background: useOtp === opt.k ? "white" : "transparent",
                            color: useOtp === opt.k ? PATIENT_COLOR : "#94A3B8",
                            fontSize: "0.8rem",
                            boxShadow: useOtp === opt.k ? "0 4px 12px rgba(0,0,0,0.05)" : "none"
                        }}>
                        {opt.icon} {opt.label}
                    </button>
                ))}
            </div>
            <AnimatePresence mode="wait">
                {!useOtp ? (
                    <motion.div key="pwd" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <FieldBlock label="Login ID (Username or Mobile)" icon={<User size={17} color={PATIENT_COLOR} />}>
                            <input type="text" className="form-control-premium w-100 ps-5" placeholder="Enter your ID"
                                value={patientId} onChange={e => setPatientId(e.target.value)} />
                        </FieldBlock>
                        <FieldBlock label="Secure Password" icon={<Lock size={17} color={PATIENT_COLOR} />}>
                            <input type={showPatientPass ? "text" : "password"} className="form-control-premium w-100 ps-5 pe-5"
                                placeholder="••••••••" value={patientPass} onChange={e => setPatientPass(e.target.value)} />
                            <EyeToggle show={showPatientPass} onToggle={() => setShowPatientPass(!showPatientPass)} />
                        </FieldBlock>
                        <SubmitBtn label="Login as Patient" color={PATIENT_COLOR} loading={!!loading}
                            disabled={!patientId || !patientPass || !!loading}
                            onClick={() => onCredentialsLogin(patientId, patientPass)} />
                    </motion.div>
                ) : (
                    <motion.div key="otp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <FieldBlock label="Registered Mobile Number" icon={<span className="fw-bold ms-3" style={{ color: PATIENT_COLOR }}>+91</span>}>
                            <input type="tel" className="form-control-premium w-100 ps-5" placeholder="70000 00000"
                                value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} />
                        </FieldBlock>
                        <p className="text-muted mb-4 ps-1" style={{ fontSize: "11px" }}>
                            <ShieldCheck size={12} className="me-1" style={{ color: PATIENT_COLOR }} />
                            We will send a 4-digit secure code to your number.
                        </p>
                        <SubmitBtn label="Request OTP" color={PATIENT_COLOR} loading={!!loading}
                            disabled={mobile.length !== 10 || !!loading} onClick={onNext} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    // ─── Patient Signup ───────────────────────────────────────────────────────
    const renderPatientSignup = () => (
        <motion.div key="ps" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="pt-2">
            <FieldBlock label="Public Username" icon={<User size={17} color={PATIENT_COLOR} />}>
                <input type="text" className="form-control-premium w-100 ps-5" placeholder="john_doe"
                    value={signupUsername} onChange={e => setSignupUsername(e.target.value)} />
            </FieldBlock>
            <FieldBlock label="Primary Mobile" icon={<span className="fw-bold ms-3" style={{ color: PATIENT_COLOR }}>+91</span>}>
                <input type="tel" className="form-control-premium w-100 ps-5" placeholder="70000 00000"
                    value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} />
            </FieldBlock>
            <FieldBlock label="Secure Password" icon={<Lock size={17} color={PATIENT_COLOR} />}>
                <input type={showSignupPass ? "text" : "password"} className="form-control-premium w-100 ps-5 pe-5"
                    placeholder="••••••••" value={signupPass} onChange={e => setSignupPass(e.target.value)} />
                <EyeToggle show={showSignupPass} onToggle={() => setShowSignupPass(!showSignupPass)} />
            </FieldBlock>
            <SubmitBtn label="Start Your Journey" color={PATIENT_COLOR} loading={!!loading} icon={<UserPlus size={18} />}
                disabled={!signupUsername || mobile.length !== 10 || !signupPass || !!loading}
                onClick={() => onSignup(signupUsername, mobile, signupPass)} />
        </motion.div>
    );

    // ─── Doctor Login ─────────────────────────────────────────────────────────
    const renderDoctorLogin = () => (
        <motion.div key="dl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="pt-2">
            <div className="rounded-4 p-4 mb-4 d-flex align-items-center gap-3 overflow-hidden position-relative"
                style={{ background: `${DOCTOR_COLOR}08`, border: `1px solid ${DOCTOR_COLOR}15` }}>
                <div className="position-absolute top-0 end-0 opacity-10 rotate-12" style={{ marginRight: '-20px', marginTop: '-10px' }}>
                    <Stethoscope size={80} color={DOCTOR_COLOR} />
                </div>
                <div className="bg-white rounded-circle p-2 shadow-sm z-1">
                    <Stethoscope size={24} style={{ color: DOCTOR_COLOR }} />
                </div>
                <div className="z-1">
                    <h6 className="mb-0 fw-bold outfit text-dark">Practitioner Access</h6>
                    <p className="m-0 text-muted" style={{ fontSize: "0.75rem" }}>
                        Manage your patient queue and health records.
                    </p>
                </div>
            </div>
            <FieldBlock label="Professional ID" icon={<User size={17} color={DOCTOR_COLOR} />}>
                <input type="text" className="form-control-premium w-100 ps-5" placeholder="Enter your username"
                    value={doctorId} onChange={e => setDoctorId(e.target.value)} />
            </FieldBlock>
            <FieldBlock label="Passphrase" icon={<Lock size={17} color={DOCTOR_COLOR} />}>
                <input type={showDoctorPass ? "text" : "password"} className="form-control-premium w-100 ps-5 pe-5"
                    placeholder="••••••••" value={doctorPass} onChange={e => setDoctorPass(e.target.value)} />
                <EyeToggle show={showDoctorPass} onToggle={() => setShowDoctorPass(!showDoctorPass)} />
            </FieldBlock>
            <SubmitBtn label="Access Dashboard" color={DOCTOR_COLOR} loading={!!loading}
                disabled={!doctorId || !doctorPass || !!loading}
                onClick={() => onCredentialsLogin(doctorId, doctorPass)} />
        </motion.div>
    );

    // ─── Doctor Signup ────────────────────────────────────────────────────────
    const renderDoctorSignup = () => (
        <motion.div key="ds" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="pt-2">
            <div className="row g-2">
                <div className="col-12">
                    <FieldBlock label="Full Legal Name" icon={<User size={17} color={DOCTOR_COLOR} />}>
                        <input type="text" className="form-control-premium w-100 ps-5" placeholder="Dr. Jane Smith"
                            value={docName} onChange={e => setDocName(e.target.value)} />
                    </FieldBlock>
                </div>

                <div className="col-12">
                    <div className="position-relative mb-3">
                        <label className="form-label ms-1 fw-bold text-muted mb-2"
                            style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Primary Specialization
                        </label>
                        <button type="button" onClick={() => setDropdownOpen(o => !o)}
                            className="w-100 d-flex align-items-center justify-content-between p-3 rounded-3 border fw-semibold text-start transition-all"
                            style={{
                                background: selectedSpec ? `${DOCTOR_COLOR}05` : "rgba(255,255,255,0.45)",
                                borderColor: selectedSpec ? DOCTOR_COLOR : "#E2E8F0",
                                color: selectedSpec ? "#1E293B" : "#94A3B8",
                                cursor: "pointer",
                                backdropFilter: "blur(12px)"
                            }}>
                            <span className="d-flex align-items-center gap-2">
                                <Briefcase size={16} style={{ color: selectedSpec ? DOCTOR_COLOR : "#94A3B8" }} />
                                {selectedSpec ? selectedSpec.name : "Choose Focus Area..."}
                            </span>
                            <ChevronDown size={16} style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    className="position-absolute w-100 bg-white rounded-4 shadow-premium border overflow-auto"
                                    style={{ zIndex: 9999, top: "calc(100% + 8px)", maxHeight: "200px" }}>
                                    {specializations.length === 0 ? (
                                        <div className="p-4 text-center text-muted small">Loading specializations...</div>
                                    ) : (
                                        specializations.map(spec => (
                                            <button key={spec.id} type="button"
                                                onClick={() => { setSelectedSpec(spec); setDropdownOpen(false); }}
                                                className="w-100 d-flex align-items-center gap-3 p-3 border-0 text-start hover-bg-light transition-all"
                                                style={{ background: selectedSpec?.id === spec.id ? `${DOCTOR_COLOR}08` : "transparent", cursor: "pointer" }}>
                                                <div className="fw-bold small text-dark">{spec.name}</div>
                                                {selectedSpec?.id === spec.id && <CheckCircle size={16} className="ms-auto flex-shrink-0" style={{ color: DOCTOR_COLOR }} />}
                                            </button>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="col-12">
                    <FieldBlock label="Professional Handle" icon={<KeyRound size={17} color={DOCTOR_COLOR} />}>
                        <input type="text" className="form-control-premium w-100 ps-5" placeholder="dr_identifier"
                            value={docUsername} onChange={e => setDocUsername(e.target.value)} />
                    </FieldBlock>
                </div>

                <div className="col-12">
                    <FieldBlock label="Secret Passphrase" icon={<Lock size={17} color={DOCTOR_COLOR} />}>
                        <input type={showDocPass ? "text" : "password"} className="form-control-premium w-100 ps-5 pe-5"
                            placeholder="••••••••" value={docPass} onChange={e => setDocPass(e.target.value)} />
                        <EyeToggle show={showDocPass} onToggle={() => setShowDocPass(!showDocPass)} />
                    </FieldBlock>
                </div>
            </div>

            <SubmitBtn label="Join Medical Network" color={DOCTOR_COLOR} loading={docSignupLoading} icon={<UserPlus size={18} />}
                disabled={!docName || !selectedSpec || !docUsername || !docPass || docSignupLoading}
                onClick={handleDoctorSignup} />
        </motion.div>
    );

    return (
        <div className="w-100">
            {/* ── Role Multi-Switch ─────────────────────────────────────── */}
            <div className="position-relative mb-5"
                style={{ background: "rgba(241, 245, 249, 0.5)", borderRadius: "20px", padding: "6px", border: "1px solid rgba(0,0,0,0.03)" }}>
                <motion.div
                    layoutId="role-pill"
                    animate={{ x: role === "patient" ? 0 : "100%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="position-absolute top-0 start-0 h-100 rounded-4 shadow-premium"
                    style={{
                        width: "50%",
                        background: role === "patient"
                            ? "linear-gradient(135deg, #46C2DE, #38A9C8)"
                            : "linear-gradient(135deg, #10B981, #059669)",
                        zIndex: 0
                    }}
                />
                <div className="d-flex position-relative h-100" style={{ zIndex: 1 }}>
                    <button onClick={() => handleRoleChange("patient")}
                        className="flex-grow-1 btn border-0 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all"
                        style={{ color: role === "patient" ? "white" : "#64748B", fontSize: "0.9rem", background: "transparent" }}>
                        <Heart size={18} fill={role === "patient" ? "white" : "none"} />
                        <span className="outfit">Patient</span>
                    </button>
                    <button onClick={() => handleRoleChange("doctor")}
                        className="flex-grow-1 btn border-0 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all"
                        style={{ color: role === "doctor" ? "white" : "#64748B", fontSize: "0.9rem", background: "transparent" }}>
                        <Stethoscope size={18} />
                        <span className="outfit">Professional</span>
                    </button>
                </div>
            </div>



            {/* ── Main Form Area ───────────────────────────────────────── */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {role === "patient" && authTab === "login" && renderPatientLogin()}
                    {role === "patient" && authTab === "signup" && renderPatientSignup()}
                    {role === "doctor" && authTab === "login" && renderDoctorLogin()}
                    {role === "doctor" && authTab === "signup" && renderDoctorSignup()}
                </AnimatePresence>
            </div>

            {/* ── Quick Toggle ────────────────────────────────────────── */}
            <div className="text-center mt-3 pt-2">
                {authTab === "login" ? (
                    <p className="small text-muted mb-0">New to the platform? <span className="fw-bold cursor-pointer transition-all hover-opacity" style={{ color: activeColor, textDecoration: "underline", textUnderlineOffset: "4px" }} onClick={() => setAuthTab("signup")}>Create an account</span></p>
                ) : (
                    <p className="small text-muted mb-0">Already have an account? <span className="fw-bold cursor-pointer transition-all hover-opacity" style={{ color: activeColor, textDecoration: "underline", textUnderlineOffset: "4px" }} onClick={() => setAuthTab("login")}>Login here</span></p>
                )}
            </div>

            {/* ── Trust Section ────────────────────────────────────────── */}
            <div className="text-center mt-5">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <div className="h-px bg-light flex-grow-1" />
                    <span className="smallest text-muted fw-bold uppercase tracking-widest opacity-50">Enterprise Security</span>
                    <div className="h-px bg-light flex-grow-1" />
                </div>
                <p className="text-muted smallest px-4">
                    End-to-end encrypted session. Your data is protected by <span className="text-dark fw-bold">HIPAA-compliant</span> protocols.
                </p>
            </div>
        </div>
    );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function FieldBlock({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <label className="form-label ms-1 fw-bold text-muted mb-2 ps-1"
                style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {label}
            </label>
            <div className="position-relative d-flex align-items-center group">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-3 transition-all"
                    style={{ pointerEvents: "none", zIndex: 10 }}>
                    {icon}
                </span>
                {children}
            </div>
        </div>
    );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
    return (
        <button type="button" onClick={onToggle}
            className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-muted p-1 border-0 hover-scale"
            style={{ zIndex: 2 }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );
}

function SubmitBtn({ label, color, loading, disabled, onClick, icon }: {
    label: string; color: string; loading: boolean; disabled: boolean; onClick: () => void; icon?: React.ReactNode;
}) {
    return (
        <motion.button
            whileHover={!disabled ? { y: -4, scale: 1.01 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className="btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 mt-4 transition-all"
            style={{
                background: disabled ? "#F1F5F9" : `linear-gradient(135deg, ${color}, ${color}EE)`,
                color: disabled ? "#CBD5E1" : "white",
                border: "none",
                borderRadius: "18px",
                fontSize: "1rem",
                boxShadow: disabled ? "none" : `0 12px 24px ${color}30`,
                height: "60px"
            }}
            onClick={onClick} disabled={disabled}>
            {loading
                ? <div className="spinner-border spinner-border-sm text-white" role="status" />
                : <><span className="outfit tracking-tight">{label}</span>{icon ?? <ArrowRight size={20} />}</>}
        </motion.button>
    );
}
