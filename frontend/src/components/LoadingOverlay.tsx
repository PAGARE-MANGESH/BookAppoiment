"use client";

import { motion } from "framer-motion";

export default function LoadingOverlay() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 d-flex align-items-center justify-content-center"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 9999
            }}
        >
            <div className="text-center">
                <div className="position-relative d-inline-block">
                    {/* Ring 1 */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="rounded-circle border border-2 border-primary border-opacity-20"
                        style={{ width: '80px', height: '80px', borderTopColor: '#46C2DE' }}
                    />
                    {/* Ring 2 */}
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="position-absolute top-50 start-50 translate-middle rounded-circle border border-2 border-primary border-opacity-10"
                        style={{ width: '60px', height: '60px', borderBottomColor: '#37AECB' }}
                    />
                    {/* Heart Center */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="position-absolute top-50 start-50 translate-middle text-primary"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </motion.div>
                </div>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 fw-bold text-dark outfit"
                    style={{ letterSpacing: '0.5px' }}
                >
                    HEALTH<span className="text-primary">SYNC</span>
                </motion.p>
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-muted small"
                >
                    Initializing secure connection...
                </motion.div>
            </div>
        </motion.div>
    );
}
