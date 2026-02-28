"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AxiosInstance from "@/lib/AxiosInstance";

export default function FloatingChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Diagnostic AI Online. How can I assist you today, Commander?' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await AxiosInstance.post('chat/', { message: userMsg });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to neural link. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 d-flex flex-column align-items-end" style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 2000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className="glass-container mb-4 d-flex flex-column border-premium shadow-premium-lg"
                        style={{
                            width: '380px',
                            height: '550px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(70, 194, 222, 0.2)',
                            borderRadius: '24px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div className="p-4 border-bottom border-light d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(90deg, rgba(70, 194, 222, 0.05) 0%, rgba(255, 255, 255, 0) 100%)' }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                    <Bot size={22} className="text-white" />
                                </div>
                                <div>
                                    <div className="fw-bold text-dark outfit tracking-tight">HealthSync AI</div>
                                    <div className="d-flex align-items-center gap-1">
                                        <span className="bg-success rounded-circle" style={{ width: '6px', height: '6px' }}></span>
                                        <span className="text-muted fw-bold uppercase" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Neural Link Active</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="btn btn-light rounded-circle p-2 border-0 shadow-xs">
                                <Minimize2 size={18} className="text-muted" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-grow-1 p-4 overflow-y-auto scroll-hide d-flex flex-column gap-3"
                            style={{ background: 'radial-gradient(circle at center, rgba(70, 194, 222, 0.02) 0%, transparent 100%)' }}
                        >
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={i}
                                    className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                >
                                    <div className={`p-3 rounded-4 shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary text-white font-weight-bold'
                                        : 'bg-white border border-light-subtle text-dark'
                                        }`} style={{
                                            maxWidth: '85%',
                                            fontSize: '13.5px',
                                            lineHeight: '1.5',
                                            borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
                                            borderTopLeftRadius: msg.role === 'bot' ? '4px' : '20px'
                                        }}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="d-flex justify-content-start">
                                    <div className="bg-light p-3 rounded-4 border border-light-subtle shadow-xs">
                                        <div className="typing-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-top">
                            <div className="input-group bg-light p-1 rounded-pill border border-light-subtle shadow-xs">
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 text-dark small px-3 py-2 fw-medium"
                                    placeholder="Ask anything about your health..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="btn btn-premium rounded-circle p-2 d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-premium rounded-circle p-0 shadow-premium d-flex align-items-center justify-content-center"
                style={{ width: '64px', height: '64px', zIndex: 2001, border: '4px solid white' }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X size={28} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <MessageSquare size={28} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            <style jsx>{`
                .scroll-hide::-webkit-scrollbar { display: none; }
                .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .typing-dots span {
                    width: 6px;
                    height: 6px;
                    background: var(--primary);
                    border-radius: 50%;
                    display: inline-block;
                    margin: 0 2px;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
                .shadow-xs { box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            `}</style>
        </div>
    );
}
