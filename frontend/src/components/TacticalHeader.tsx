"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, Menu, User, LogOut, ChevronDown, Heart, Clock as ClockIcon, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import AxiosInstance from "@/lib/AxiosInstance";
import { showConfirm } from "@/lib/alerts";

export default function TacticalHeader({ title, onMenuClick }: { title: string, onMenuClick?: () => void }) {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<{ name: string, photo: string }>({ name: "User", photo: "" });
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await AxiosInstance.get('profile/');
                setUserProfile({
                    name: response.data.name,
                    photo: response.data.profile_photo || ""
                });
            } catch (err) {
                const storedName = localStorage.getItem('user_name');
                if (storedName) setUserProfile(prev => ({ ...prev, name: storedName }));
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchNotifs = () => {
            try {
                const item = localStorage.getItem('user_notifications');
                const stored = item ? JSON.parse(item) : [];
                setNotifications(Array.isArray(stored) ? stored : []);
            } catch (e) {
                setNotifications([]);
            }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const clearNotifications = () => {
        localStorage.setItem('user_notifications', '[]');
        setNotifications([]);
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
            }
        } catch (error) {
            console.error("Logout error:", error);
            localStorage.clear();
            window.location.href = '/';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || "U";
    };

    return (
        <header className="px-4 py-3 d-flex align-items-center justify-content-between border-bottom sticky-top"
            style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                zIndex: 1000,
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)'
            }}>

            <div className="d-flex align-items-center gap-3">
                <button onClick={onMenuClick} className="btn d-lg-none p-2 rounded-3 bg-light border-0 text-dark transition-all">
                    <Menu size={20} />
                </button>

                {/* Logo in Topbar - Icon Only */}
                <div className="d-none d-lg-flex align-items-center me-2 cursor-pointer transition-all hover-scale" onClick={() => router.push('/home')}>
                    <div className="bg-primary rounded-3 p-1.5 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                        <Heart size={20} className="text-white" fill="white" />
                    </div>
                </div>

                <div>
                    <h5 className="fw-bold m-0 text-dark outfit tracking-tight">{title}</h5>
                    <span className="text-muted d-block outfit d-lg-none" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.7 }}>
                        {mounted ? currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "-"}
                    </span>
                </div>
            </div>

            <div className="d-flex align-items-center gap-3">
                {/* Clock and Date */}
                <div className="d-none d-md-flex align-items-center gap-3 bg-light rounded-pill px-4 py-1.5 border border-light-subtle shadow-sm transition-all hover-shadow">
                    <div className="d-flex align-items-center gap-2">
                        <ClockIcon size={16} className="text-primary animate-pulse" />
                        <span className="fw-bold text-dark outfit" style={{ fontSize: '1rem', minWidth: '95px', letterSpacing: '-0.5px' }}>
                            {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
                        </span>
                    </div>
                    <div className="vr" style={{ height: '20px', color: '#CBD5E1' }}></div>
                    <div className="d-flex align-items-center gap-2 pe-1">
                        <span className="text-muted outfit fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            {mounted ? currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                        </span>
                    </div>
                </div>

                {/* Notifications */}
                <div className="position-relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`btn p-2 rounded-circle border-0 transition-all shadow-sm ${isNotifOpen ? 'bg-primary text-white' : 'bg-light text-dark hover-bg'}`}
                    >
                        <Bell size={20} className={isNotifOpen ? "text-white" : "text-secondary"} />
                        {notifications.length > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white"
                                style={{ transform: 'translate(-60%, 60%)', fontSize: '10px' }}>
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="dropdown-menu-custom position-absolute end-0 mt-3 p-0 rounded-4 shadow-lg border border-light-subtle bg-white overflow-hidden"
                            style={{ width: '300px', zIndex: 1100, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                                <h6 className="m-0 fw-bold outfit text-dark">Recent Activities</h6>
                                <button onClick={clearNotifications} className="btn p-0 border-0 text-primary fw-bold" style={{ fontSize: '11px' }}>Clear All</button>
                            </div>
                            <div className="overflow-y-auto scroll-hide" style={{ maxHeight: '350px' }}>
                                {notifications.length === 0 ? (
                                    <div className="p-5 text-center">
                                        <Bell size={32} className="text-muted opacity-25 mb-2" />
                                        <p className="text-muted small m-0 fw-medium">No new notifications</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="px-4 py-3 border-bottom hover-bg transition-all cursor-pointer">
                                            <div className="d-flex gap-3">
                                                <div className={`p-2 rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center ${notif.type.includes('reject') ? 'bg-danger-subtle text-danger' :
                                                    notif.type.includes('accept') ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'
                                                    }`} style={{ width: '36px', height: '36px' }}>
                                                    {notif.type.includes('reject') ? <XCircle size={18} /> :
                                                        notif.type.includes('accept') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                </div>
                                                <div>
                                                    <p className="m-0 text-dark small fw-semibold lh-sm mb-1">{notif.message}</p>
                                                    <span className="text-muted" style={{ fontSize: '10px' }}>
                                                        {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="ms-2 position-relative" ref={dropdownRef}>
                    <div
                        className="d-flex align-items-center gap-2 rounded-pill p-1 cursor-pointer transition-all hover-bg profile-trigger shadow-sm"
                        style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="bg-primary text-white fw-bold rounded-circle d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                            style={{ width: '38px', height: '38px', fontSize: '14px' }}>
                            {userProfile.photo ? (
                                <img src={userProfile.photo} alt={userProfile.name} className="w-100 h-100 object-cover" />
                            ) : (
                                getInitials(userProfile.name)
                            )}
                        </div>
                        <div className="d-none d-lg-block me-2">
                            <p className="m-0 outfit fw-bold text-dark" style={{ fontSize: '0.85rem', lineHeight: 1 }}>{userProfile.name.split(' ')[0]}</p>
                            <span className="text-muted outfit" style={{ fontSize: '10px' }}>Member</span>
                        </div>
                        <ChevronDown size={14} className={`text-muted transition-all me-1 d-none d-sm-block ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="dropdown-menu-custom position-absolute end-0 mt-3 p-2 rounded-3 shadow-lg border border-light-subtle bg-white"
                            style={{
                                width: '210px',
                                zIndex: 1100,
                                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                            <div className="px-3 py-2 mb-2 border-bottom">
                                <p className="m-0 fw-bold text-dark outfit text-truncate">{userProfile.name}</p>
                                <span className="text-muted small">Healthcare Member</span>
                            </div>
                            <button
                                onClick={() => { router.push('/profile'); setIsDropdownOpen(false); }}
                                className="dropdown-item-custom d-flex align-items-center gap-2 p-2 rounded-2 w-100 border-0 bg-transparent text-start mb-1 transition-all"
                            >
                                <div className="p-1.5 rounded-2 bg-primary-subtle text-primary">
                                    <User size={16} />
                                </div>
                                <span className="outfit fw-semibold" style={{ fontSize: '0.9rem' }}>My Profile</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="dropdown-item-custom d-flex align-items-center gap-2 p-2 rounded-2 w-100 border-0 bg-transparent text-start text-danger transition-all"
                            >
                                <div className="p-1.5 rounded-2 bg-danger-subtle">
                                    <LogOut size={16} />
                                </div>
                                <span className="outfit fw-semibold" style={{ fontSize: '0.9rem' }}>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .hover-scale:hover { transform: scale(1.05); }
                .cursor-pointer { cursor: pointer; }
                .hover-bg:hover { background: #F8FAFC !important; }
                .profile-trigger:hover { border-color: var(--primary) !important; background: white !important; }
                .rotate-180 { transform: rotate(180deg); }
                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .hover-shadow:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important; }
                .dropdown-item-custom:hover { background: #F8FAFC !important; transform: translateX(5px); }
                .bg-primary-subtle { background: rgba(70, 194, 222, 0.1); }
                .bg-danger-subtle { background: rgba(220, 38, 38, 0.1); }
                .bg-success-subtle { background: rgba(16, 185, 129, 0.1); }
                .scroll-hide::-webkit-scrollbar { display: none; }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </header>
    );
}
