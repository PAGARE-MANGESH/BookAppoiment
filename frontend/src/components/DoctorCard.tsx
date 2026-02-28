"use client";

import { motion } from "framer-motion";
import { Star, ChevronRight, Activity, Award } from "lucide-react";
import NextImage from "next/image";
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
}

export default function DoctorCard({ doc }: { doc: Doctor }) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/doctor/${doc.id}`)}
            className="glass-container p-3 mb-3 cursor-pointer d-flex gap-3 align-items-center hover-lift border-premium"
            style={{ borderLeft: '4px solid var(--primary)' }}
        >
            <div className="position-relative flex-shrink-0">
                <div className="rounded-circle overflow-hidden bg-light border border-light-subtle shadow-sm" style={{ width: '64px', height: '64px' }}>
                    <NextImage
                        src={doc.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}`}
                        alt={doc.name}
                        width={64}
                        height={64}
                        className="object-cover transition-all"
                    />
                </div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                    style={{ width: '16px', height: '16px' }}
                />
            </div>

            <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex justify-content-between align-items-start">
                    <div className="overflow-hidden">
                        <h6 className="fw-bold mb-0 text-dark outfit tracking-tight">{doc.name}</h6>
                        <span className="text-primary fw-bold d-block smallest uppercase tracking-wider mt-1">{doc.specialization_name}</span>
                    </div>
                    <div className="d-flex align-items-center gap-1 bg-warning-soft px-2 py-1 rounded-pill flex-shrink-0 ms-2">
                        <Star size={12} className="text-warning fill-warning" />
                        <span className="fw-bold text-dark" style={{ fontSize: '11px' }}>{doc.rating}</span>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-light-subtle">
                    <div className="d-flex align-items-center gap-3">
                        <span className="text-muted fw-bold d-flex align-items-center gap-1 opacity-75" style={{ fontSize: '10px' }}>
                            <Award size={12} className="text-primary" /> {doc.experience}Y EXP
                        </span>
                        <span className="text-muted fw-bold d-flex align-items-center gap-1 opacity-75" style={{ fontSize: '10px' }}>
                            <Activity size={12} className="text-primary" /> {doc.reviews_count}+ REVIEWS
                        </span>
                    </div>
                    <motion.div whileHover={{ x: 3 }} className="text-primary">
                        <ChevronRight size={18} />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
