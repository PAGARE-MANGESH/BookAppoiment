"use client";

import { motion } from "framer-motion";
import { Clock, Calendar, ChevronRight, Video, CreditCard, XCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { showSuccess, showError, showConfirm } from "@/lib/alerts";
import AxiosInstance from "@/lib/AxiosInstance";

interface Appointment {
    id: number;
    doctor_name: string;
    specialization_name: string;
    slot_time: string;
    appointment_date: string;
    patient_name: string;
    status: string;
}

export default function AppointmentCard({ booking, onCancel, onUpdate }: { booking: Appointment; idx?: number, onCancel?: (id: number) => void, onUpdate?: () => void }) {
    const [processing, setProcessing] = useState(false);

    const isPending = booking.status === 'Upcoming';
    const isAccepted = booking.status === 'Accepted';
    const isBooked = booking.status === 'Booked';
    const isCompleted = booking.status === 'Completed';
    const isRejected = booking.status === 'Rejected';
    const isCanceled = booking.status === 'Canceled';

    const getStatusConfig = () => {
        switch (booking.status) {
            case 'Upcoming': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'Pending Approval', icon: Clock };
            case 'Accepted': return { color: '#46C2DE', bg: 'rgba(70, 194, 222, 0.1)', label: 'Payment Required', icon: CreditCard };
            case 'Booked': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Confirmed', icon: CheckCircle2 };
            case 'Completed': return { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', label: 'Completed', icon: CheckCircle2 };
            case 'Rejected': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Rejected', icon: XCircle };
            case 'Canceled': return { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', label: 'Canceled', icon: AlertCircle };
            default: return { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)', label: booking.status, icon: AlertCircle };
        }
    };

    const config = getStatusConfig();

    const handlePayment = async () => {
        const result = await showConfirm(
            "Complete Payment",
            "Securely pay the consultation fee to finalize your booking?"
        );

        if (result.isConfirmed) {
            setProcessing(true);
            try {
                // Using the dedicated payment endpoint
                await AxiosInstance.post(`appointments/${booking.id}/make_payment/`);
                showSuccess("Payment successful! Your appointment is now confirmed.");
                onUpdate?.();
            } catch (err) {
                showError("Payment processing failed. Please try again.");
            } finally {
                setProcessing(false);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="glass-container p-4 h-100 d-flex flex-column hover-lift border-premium"
            style={{ borderTop: `4px solid ${config.color}` }}
        >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="d-flex gap-3 align-items-center">
                    <div className="position-relative flex-shrink-0">
                        <div className="rounded-circle overflow-hidden border border-light-subtle shadow-sm" style={{ width: '56px', height: '56px' }}>
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.doctor_name}`}
                                alt="doc"
                                className="object-cover w-100 h-100"
                            />
                        </div>
                    </div>
                    <div>
                        <h6 className="fw-bold mb-0 text-dark outfit tracking-tight">{booking.doctor_name}</h6>
                        <span className="text-primary fw-bold smallest uppercase tracking-wider d-block mt-1">{booking.specialization_name}</span>
                    </div>
                </div>
                <div className="d-flex flex-column align-items-end">
                    <span className="badge-custom shadow-sm d-flex align-items-center gap-1" style={{
                        fontSize: '10px',
                        letterSpacing: '0.5px',
                        background: config.bg,
                        color: config.color
                    }}>
                        <config.icon size={12} />
                        {config.label.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="bg-light p-3 rounded-4 mb-4 d-flex flex-wrap gap-3 border border-light-subtle">
                <div className="d-flex align-items-center gap-2">
                    <div className="p-1.5 rounded-3 bg-white shadow-xs">
                        <Calendar size={14} className="text-primary" />
                    </div>
                    <span className="small text-dark fw-bold" style={{ fontSize: '12px' }}>{formatDate(booking.appointment_date)}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="p-1.5 rounded-3 bg-white shadow-xs">
                        <Clock size={14} className="text-primary" />
                    </div>
                    <span className="small fw-bold text-dark" style={{ fontSize: '12px' }}>{booking.slot_time}</span>
                </div>
            </div>

            {/* Notifications / Alerts */}
            {isAccepted && (
                <div className="alert alert-info py-2 px-3 rounded-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '11px', border: '1px solid #46C2DE30', background: '#46C2DE05' }}>
                    <AlertCircle size={14} />
                    <span className="fw-medium text-dark">Approved by doctor! Finalize with payment.</span>
                </div>
            )}

            {/* Actions */}
            <div className="d-flex gap-2 mt-auto">
                {isPending && (
                    <>
                        <button
                            onClick={() => onCancel && onCancel(booking.id)}
                            className="btn btn-light flex-grow-1 py-2.5 fw-bold border-light-subtle small shadow-xs hover-bg-danger-soft transition-all"
                        >
                            Cancel Request
                        </button>
                        <div className="btn btn-premium flex-grow-1 py-2.5 d-flex align-items-center justify-content-center gap-2 small shadow-premium opacity-50 cursor-not-allowed">
                            Pending Approval
                        </div>
                    </>
                )}

                {isAccepted && (
                    <button
                        onClick={handlePayment}
                        disabled={processing}
                        className="btn btn-premium w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-premium transition-all hover-scale"
                    >
                        {processing ? <div className="spinner-border spinner-border-sm" /> : <><CreditCard size={18} /> Make Payment</>}
                    </button>
                )}

                {isBooked && (
                    <button className="btn btn-premium w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 small shadow-premium transition-all hover-scale">
                        <Video size={18} /> Join Video Consultation
                    </button>
                )}

                {isCompleted && (
                    <button onClick={() => window.location.href = '/records'} className="btn btn-light w-100 py-2.5 fw-bold border-light-subtle d-flex align-items-center justify-content-center gap-2 small shadow-xs">
                        View Records <ChevronRight size={16} />
                    </button>
                )}

                {(isRejected || isCanceled) && (
                    <button onClick={() => window.location.href = '/doctor'} className="btn btn-premium w-100 py-2.5 fw-bold shadow-premium">
                        Re-book with Specialist
                    </button>
                )}
            </div>
        </motion.div>
    );
}

