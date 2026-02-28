"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { useState, useRef } from "react";

interface OtpViewProps {
    mobile: string;
    onBack: () => void;
    onVerify: (otp: string) => void;
    loading?: boolean;
}

export default function OtpView({ mobile, onBack, onVerify, loading }: OtpViewProps) {
    const [otp, setOtp] = useState(["", "", "", ""]);
    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto move to next input
        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        if (newOtp.every(val => val !== "")) {
            onVerify(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-100"
        >
            <button
                className="btn btn-link text-decoration-none text-muted p-0 mb-4 d-flex align-items-center gap-2 hover-lift"
                onClick={onBack}
            >
                <ArrowLeft size={16} /> <span className="smallest fw-bold outfit uppercase tracking-wider">Change Number</span>
            </button>

            <div className="text-center mb-5">
                <h2 className="fw-bold text-dark outfit mb-2">Two-Step Verification</h2>
                <p className="text-muted small fw-medium">
                    We&apos;ve sent a 4-digit verification code to
                    <span className="d-block text-primary fw-bold mt-1">+91 {mobile.slice(0, 2)}******{mobile.slice(8)}</span>
                </p>
            </div>

            <div className="d-flex justify-content-center gap-3 mb-5">
                {otp.map((digit, idx) => (
                    <input
                        key={idx}
                        ref={inputRefs[idx]}
                        type="text"
                        className="otp-input shadow-sm"
                        value={digit}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        maxLength={1}
                        inputMode="numeric"
                        disabled={loading}
                        autoFocus={idx === 0}
                    />
                ))}
            </div>

            <button
                className="btn btn-premium w-100 py-3 mb-4 shadow-premium d-flex align-items-center justify-content-center gap-2 transition-all"
                onClick={() => onVerify(otp.join(""))}
                disabled={otp.some(val => val === "") || loading}
            >
                {loading ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                ) : (
                    <>
                        <Lock size={18} />
                        <span className="fw-bold outfit">Verify & Start Experience</span>
                    </>
                )}
            </button>

            <div className="text-center">
                <p className="text-muted smallest fw-medium">
                    Didn&apos;t receive the code? <span className="text-primary fw-bold cursor-pointer underline">Request Resend</span>
                </p>
            </div>
        </motion.div>
    );
}
