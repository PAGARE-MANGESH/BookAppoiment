"use client";

import { useEffect, useState } from "react";
import AxiosInstance from "@/lib/AxiosInstance";
import { Search, Star, ArrowRight, Filter, Heart, Users, Clock, Award, ShieldCheck, MapPin, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";
import LoadingOverlay from "../../components/LoadingOverlay";
import { showError } from "@/lib/alerts";
import { useRouter } from "next/navigation";

interface Doctor {
    id: number;
    name: string;
    specialization_name: string;
    experience: number;
    rating: number;
    reviews_count: number;
    image_url: string;
    availability_time: string;
    location: string;
    about: string;
}

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [search, setSearch] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("All");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            try {
                const response = await AxiosInstance.get('doctors/');
                setDoctors(response.data);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { error?: string } } };
                console.error("Failed to fetch doctors:", error.response?.data || error);
                showError("Unable to load the list of specialists.");
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    const specialties = ["All", ...Array.from(new Set(doctors.map(d => d.specialization_name)))];

    const filteredDoctors = doctors.filter(doc => {
        const name = doc.name?.toLowerCase() || "";
        const spec = doc.specialization_name?.toLowerCase() || "";
        const query = search.toLowerCase();

        const matchesSearch = name.includes(query) || spec.includes(query);
        const matchesSpecialty = selectedSpecialty === "All" || doc.specialization_name === selectedSpecialty;
        return matchesSearch && matchesSpecialty;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>
                {loading && <LoadingOverlay />}
            </AnimatePresence>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="Specialists Network" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    {/* Hero Section */}
                    <div className="mb-5 position-relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-dark rounded-5 p-5 position-relative overflow-hidden shadow-premium-lg"
                            style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
                        >
                            <div className="position-relative z-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="d-flex align-items-center gap-2 mb-3"
                                >
                                    <Sparkles size={16} className="text-primary" />
                                    <span className="text-primary fw-bold smallest uppercase tracking-widest">Premium Healthcare Network</span>
                                </motion.div>
                                <h1 className="text-white outfit display-5 fw-bold mb-3 tracking-tight">
                                    Consult with the <span className="text-primary">Best Specialists</span>
                                </h1>
                                <p className="text-white-50 fs-5 mb-0 maxWidth-600">
                                    Discover top-tier medical professionals vetted for excellence.
                                    Instant consultations at your fingertips.
                                </p>
                            </div>

                            {/* Decorative Elements */}
                            <div className="position-absolute top-0 end-0 p-5 opacity-10 translate-middle-x d-none d-lg-block">
                                <Stethoscope size={300} className="text-white rotate-12" />
                            </div>
                            <div className="position-absolute bottom-0 start-0 w-100 h-1" style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.2 }}></div>
                        </motion.div>
                    </div>

                    {/* Filters & Search Bar */}
                    <div className="mb-5">
                        <div className="row g-4 align-items-center mb-4">
                            <div className="col-12 col-lg-7">
                                <div className="position-relative">
                                    <div className="position-absolute top-50 start-0 translate-middle-y ms-4 text-muted">
                                        <Search size={22} />
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control-premium w-100 ps-5 py-4 border-0 shadow-md bg-white outfit"
                                        placeholder="Search by specialist name, hospital, or medical condition..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ fontSize: '1.1rem', borderRadius: '24px' }}
                                    />
                                </div>
                            </div>
                            <div className="col-12 col-lg-5 d-flex justify-content-lg-end gap-3">
                                <button className="glass-container px-4 py-3 d-flex align-items-center gap-2 fw-bold text-dark border-0 hover-lift bg-white">
                                    <Filter size={18} className="text-primary" />
                                    <span>Sort by: Popularity</span>
                                </button>
                                <div className="glass-container px-3 py-2 d-flex align-items-center gap-2 border-0 bg-white">
                                    <div className="bg-success rounded-circle animate-pulse" style={{ width: '8px', height: '8px' }}></div>
                                    <span className="smallest fw-bold uppercase tracking-wider text-muted">{doctors.length} Online</span>
                                </div>
                            </div>
                        </div>

                        {/* Specialty Tabs */}
                        <div className="d-flex gap-3 overflow-x-auto pb-3 scroll-hide">
                            {specialties.map((specialty) => (
                                <button
                                    key={specialty}
                                    onClick={() => setSelectedSpecialty(specialty)}
                                    className={`px-4 py-2 rounded-pill fw-bold transition-all border-0 shadow-sm outfit text-nowrap ${selectedSpecialty === specialty
                                        ? 'bg-primary text-white scale-105'
                                        : 'bg-white text-muted hover-bg-primary-soft'
                                        }`}
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    {specialty}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Specialists Grid */}
                    <div className="row g-4">
                        <AnimatePresence mode="popLayout">
                            {filteredDoctors && filteredDoctors.length > 0 ? (
                                filteredDoctors.map((doc) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                        className="col-12 col-md-6 col-xl-4 col-xxl-3"
                                    >
                                        <div
                                            onClick={() => router.push(`/doctor/${doc.id}`)}
                                            className="glass-container p-0 overflow-hidden d-flex flex-column h-100 border-0 bg-white shadow-md hover-lift"
                                            style={{ borderRadius: '28px' }}
                                        >
                                            {/* Top Section: Profile Photo & Badge */}
                                            <div className="position-relative overflow-hidden" style={{ height: '260px' }}>
                                                {doc.image_url ? (
                                                    <NextImage
                                                        src={doc.image_url}
                                                        alt={doc.name || "Doctor"}
                                                        fill
                                                        unoptimized
                                                        className="object-cover transition-all"
                                                        style={{ filter: 'brightness(0.95)' }}
                                                    />
                                                ) : (
                                                    <div className="w-100 h-100 bg-primary-soft d-flex align-items-center justify-content-center">
                                                        <Users size={64} className="text-primary opacity-20" />
                                                    </div>
                                                )}
                                                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }}></div>

                                                <div className="position-absolute top-0 end-0 p-3">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                        className="btn btn-white bg-white bg-opacity-80 backdrop-blur-md rounded-pill p-2 border-0 shadow-sm"
                                                    >
                                                        <Heart size={18} className="text-danger" />
                                                    </button>
                                                </div>

                                                <div className="position-absolute bottom-0 start-0 p-4 w-100">
                                                    <div className="d-flex justify-content-between align-items-end">
                                                        <div>
                                                            <div className="badge bg-primary text-white mb-2 px-3 py-1 rounded-pill smallest fw-bold uppercase tracking-wider shadow-sm">
                                                                {doc.specialization_name || "Specialist"}
                                                            </div>
                                                            <h4 className="fw-bold m-0 text-white outfit">{doc.name || "Expert Doctor"}</h4>
                                                        </div>
                                                        <div className="bg-white px-2 py-1 rounded-3 shadow-premium d-flex align-items-center gap-1">
                                                            <Star size={14} className="text-warning fill-warning" />
                                                            <span className="fw-bold text-dark small">{doc.rating || "5.0"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Section: Details */}
                                            <div className="p-4 flex-grow-1 d-flex flex-column">
                                                <div className="d-flex align-items-center gap-3 mb-4">
                                                    <div className="d-flex align-items-center gap-2 text-muted small fw-medium">
                                                        <Clock size={16} className="text-primary" />
                                                        <span>{doc.availability_time || "Available Now"}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 text-muted small fw-medium">
                                                        <MapPin size={16} className="text-primary" />
                                                        <span className="text-truncate">{doc.location || "HealthSync Center"}</span>
                                                    </div>
                                                </div>

                                                <div className="row g-0 mb-4 py-3 border-top border-bottom border-light-subtle">
                                                    <div className="col-6 border-end">
                                                        <div className="text-muted smallest uppercase fw-bold mb-1 opacity-60">Success Rate</div>
                                                        <div className="fw-bold text-dark fs-5 outfit">98% <Award size={14} className="text-success ms-1 align-text-top" /></div>
                                                    </div>
                                                    <div className="col-6 ps-4">
                                                        <div className="text-muted smallest uppercase fw-bold mb-1 opacity-60">Experience</div>
                                                        <div className="fw-bold text-dark fs-5 outfit">{doc.experience || "10"}<span className="fs-6 fw-normal text-muted"> Yrs</span></div>
                                                    </div>
                                                </div>

                                                <div className="mt-auto">
                                                    <div className="btn btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2 group">
                                                        <span className="outfit">Book Consultation</span>
                                                        <ChevronRight size={18} className="transition-all group-hover-translate-x-1" />
                                                    </div>
                                                    <div className="text-center mt-3">
                                                        <span className="smallest text-success fw-bold d-flex align-items-center justify-content-center gap-1">
                                                            <ShieldCheck size={12} />
                                                            Verified Background Check
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : !loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-12 py-5 text-center"
                                >
                                    <div className="mb-4 opacity-10">
                                        <Users size={120} className="mx-auto" />
                                    </div>
                                    <h2 className="fw-bold text-dark outfit mb-2">No Specialists Found</h2>
                                    <p className="text-muted fs-5 mb-4">We couldn&apos;t find any doctors matching your current filters.</p>
                                    <button onClick={() => { setSearch(""); setSelectedSpecialty("All"); }} className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-primary">Reset Navigator</button>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            <style jsx>{`
                .maxWidth-600 { max-width: 600px; }
                .scroll-hide::-webkit-scrollbar { display: none; }
                .hover-bg-primary-soft:hover { background: rgba(70, 194, 222, 0.1) !important; color: var(--primary) !important; }
                .shadow-primary { box-shadow: 0 10px 25px rgba(70, 194, 222, 0.3); }
                .group-hover-translate-x-1 { transition: transform 0.3s ease; }
                .btn-premium:hover .group-hover-translate-x-1 { transform: translateX(4px); }
            `}</style>
        </div>
    );
}

const Stethoscope = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3Z" /><path d="M10 2s.5 7-1.5 9" /><path d="M14 2s-1.5 7 1.5 9" /><path d="M12 11v4" /><path d="M12 15a7 7 0 0 1-7-7V2" /><path d="M12 15a7 7 0 0 0 7-7V2" /><path d="M12 19a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </svg>
);
