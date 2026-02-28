"use client";

import { LayoutDashboard, Users, Calendar, LogOut, FileText, Heart, User, X, ChevronLeft, Stethoscope, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { showConfirm } from "@/lib/alerts";
import AxiosInstance from "@/lib/AxiosInstance";

const PATIENT_NAV = [
    { label: "Overview", icon: LayoutDashboard, path: "/home" },
    { label: "Specialists", icon: Users, path: "/doctor" },
    { label: "Appointments", icon: Calendar, path: "/bookings" },
    { label: "Health Vault", icon: FileText, path: "/records" },
    { label: "My Profile", icon: User, path: "/profile" },
];

const DOCTOR_NAV = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/doctor-dashboard" },
    { label: "Appointments", icon: ClipboardList, path: "/doctor-appointments" },
    { label: "Manage Shifts", icon: Calendar, path: "/doctor-slots" },
    { label: "My Account", icon: User, path: "/profile" },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [userProfile, setUserProfile] = useState<{ name: string, photo: string }>({ name: "User", photo: "" });
    const [role, setRole] = useState<'patient' | 'doctor'>('patient');

    useEffect(() => {
        const storedRole = localStorage.getItem('user_role') as 'patient' | 'doctor' | null;
        if (storedRole) setRole(storedRole);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);

            const root = document.documentElement;
            if (mobile) {
                root.style.setProperty('--sidebar-width', '0px');
            } else {
                root.style.setProperty('--sidebar-width', isCollapsed ? '90px' : '280px');
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCollapsed]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await AxiosInstance.get('profile/');
                setUserProfile({
                    name: response.data.name,
                    photo: response.data.profile_photo || ""
                });
                localStorage.setItem('user_name', response.data.name);
                if (response.data.role) {
                    setRole(response.data.role);
                    localStorage.setItem('user_role', response.data.role);
                }
            } catch (err) {
                const storedName = localStorage.getItem('user_name');
                if (storedName) setUserProfile(prev => ({ ...prev, name: storedName }));
            }
        };
        fetchUserData();
    }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "U";
    };

    const handleLogout = async () => {
        try {
            const result = await showConfirm(
                "Confirm Logout",
                "Are you sure you want to exit your safe workspace?"
            );

            if (result.isConfirmed) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/');
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            }
        } catch (error) {
            console.error("Logout error:", error);
            localStorage.clear();
            window.location.href = '/';
        }
    };

    const NAV_ITEMS = role === 'doctor' ? DOCTOR_NAV : PATIENT_NAV;
    const roleLabel = role === 'doctor' ? 'Doctor' : 'Healthcare Member';
    const roleColor = role === 'doctor' ? '#10B981' : '#46C2DE';

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && isMobile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="sidebar-overlay"
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, backdropFilter: 'blur(4px)' }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {(isMobile ? isOpen : true) && (
                    <motion.aside
                        layout
                        initial={isMobile ? { x: -300 } : { width: isCollapsed ? 90 : 280 }}
                        animate={isMobile ? { x: 0 } : { width: isCollapsed ? 90 : 280 }}
                        exit={isMobile ? { x: -300 } : undefined}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="sidebar h-100 d-flex flex-column border-end position-fixed top-0 start-0 sidebar-premium"
                        style={{ zIndex: 9999, background: 'white', overflow: 'hidden' }}
                    >
                        {/* Header */}
                        <div className="p-4 d-flex align-items-center justify-content-between">
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="d-flex align-items-center gap-2"
                                >
                                    <div className="bg-primary rounded-3 p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        {role === 'doctor' ? (
                                            <Stethoscope size={22} className="text-white" />
                                        ) : (
                                            <Heart size={22} className="text-white" fill="white" />
                                        )}
                                    </div>
                                    <span className="fw-bold fs-4 outfit tracking-tight text-dark">Health<span className="text-primary">Sync</span></span>
                                </motion.div>
                            )}

                            {isMobile ? (
                                <button onClick={onClose} className="btn btn-light rounded-circle p-2 border-0 shadow-sm">
                                    <X size={20} className="text-muted" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                    className={`btn btn-light rounded-circle p-2 border-0 shadow-sm transition-all ${isCollapsed ? 'rotate-180' : ''}`}
                                    style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
                                >
                                    <ChevronLeft size={18} className="text-muted" />
                                </button>
                            )}
                        </div>

                        {/* Role Badge */}
                        {!isCollapsed && (
                            <div className="px-3 pb-2">
                                <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2" style={{ background: `${roleColor}15` }}>
                                    <div className="rounded-circle" style={{ width: '8px', height: '8px', background: roleColor }} />
                                    <span className="smallest fw-bold uppercase tracking-widest" style={{ color: roleColor }}>
                                        {role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-grow-1 px-3 py-4 d-flex flex-column gap-2 overflow-y-auto scroll-hide">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <motion.div key={item.path} whileHover={{ x: 6 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            href={item.path}
                                            className={`nav-link-premium ${isActive ? 'active' : ''}`}
                                            onClick={() => isMobile && onClose?.()}
                                        >
                                            <div className="icon-wrapper">
                                                <item.icon size={22} />
                                            </div>
                                            {!isCollapsed && <span className="nav-label">{item.label}</span>}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </nav>

                        {/* Account Section */}
                        <div className="p-4 bg-white border-top border-light-subtle logout-container" style={{ position: 'relative', zIndex: 1100 }}>
                            {!isCollapsed && (
                                <div className="user-profile-card mb-3 d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: '#F8FAFC' }}>
                                    <div className="profile-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '40px', height: '40px' }}>
                                        {userProfile.photo ? (
                                            <img src={userProfile.photo} alt={userProfile.name} className="w-100 h-100 object-cover" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="profile-info overflow-hidden">
                                        <p className="name text-truncate mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{userProfile.name}</p>
                                        <p className="role text-truncate mb-0 fw-semibold" style={{ fontSize: '0.75rem', color: roleColor }}>{roleLabel}</p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                id="sidebar-logout-btn"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await handleLogout();
                                }}
                                className={`logout-btn w-100 ${isCollapsed ? 'p-2 justify-content-center' : 'p-3'}`}
                                style={{
                                    position: 'relative',
                                    zIndex: 10000,
                                    cursor: 'pointer',
                                    pointerEvents: 'auto'
                                }}
                            >
                                <LogOut size={20} />
                                {!isCollapsed && <span className="fw-bold ms-2">Logout</span>}
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .sidebar-premium {
                    box-shadow: 10px 0 40px rgba(0,0,0,0.03);
                }
                .scroll-hide::-webkit-scrollbar {
                    display: none;
                }
                .nav-link-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: #64748B;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .nav-link-premium:hover {
                    background: #F1F5F9;
                    color: var(--primary);
                }
                .nav-link-premium.active {
                    background: var(--primary-gradient);
                    color: white;
                    box-shadow: 0 4px 12px rgba(70, 194, 222, 0.2);
                }
            `}</style>
        </>
    );
}

