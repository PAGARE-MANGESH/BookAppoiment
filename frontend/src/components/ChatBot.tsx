"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import AxiosInstance from '@/lib/AxiosInstance';

interface ChatBotProps {
    inline?: boolean;
}

export default function ChatBot({ inline }: ChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const response = await AxiosInstance.post('chat/', { message: userMsg });
            setMessages(prev => [...prev, { role: 'bot', text: response.data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: "SYSTEM_ERROR: CONNECTION_FAILED. RETRYING..." }]);
        } finally {
            setLoading(false);
        }
    };

    const ChatContent = (
        <div className={`d-flex flex-column h-100 ${inline ? '' : 'premium-card overflow-hidden shadow-2xl'}`}
            style={{ background: inline ? 'transparent' : 'var(--card-bg)', border: inline ? 'none' : '1px solid var(--card-border)' }}>

            {!inline && (
                <div className="p-3 border-bottom border-opacity-10 d-flex justify-content-between align-items-center"
                    style={{ background: 'rgba(0, 209, 255, 0.1)' }}>
                    <div className="d-flex align-items-center gap-2">
                        <Bot size={20} className="text-primary" />
                        <div>
                            <h6 className="fw-bold mb-0 small">AI INTEL ASSISTANT</h6>
                            <span className="text-primary fw-bold" style={{ fontSize: '8px', letterSpacing: '1px' }}>SYSTEM_SECURE</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="btn btn-link text-muted p-1">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-grow-1 overflow-y-auto p-4 scroll-hide d-flex flex-column gap-3">
                {messages.length === 0 && (
                    <div className="text-center py-5 opacity-30 mt-5">
                        <div className="glitch-container">
                            <Bot size={40} className="mb-3" />
                        </div>
                        <p className="small tracking-widest uppercase">INITIALIZING_COMM_LINK...</p>
                        <p className="small text-muted" style={{ fontSize: '10px' }}>WAITING FOR INPUT</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={idx}
                        className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                        <div className={`p-3 rounded-3 max-width-80 ${msg.role === 'user'
                            ? 'bg-primary text-black fw-bold'
                            : 'bg-dark bg-opacity-40 border border-opacity-10 text-white'
                            }`}
                            style={{ maxWidth: '85%', fontSize: '13px', borderTopLeftRadius: msg.role === 'bot' ? '0' : '8px', borderTopRightRadius: msg.role === 'user' ? '0' : '8px' }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                {msg.role === 'bot' ? <Bot size={12} className="text-primary" /> : <User size={12} />}
                                <span className="fw-bold uppercase" style={{ fontSize: '9px', letterSpacing: '1px' }}>
                                    {msg.role === 'bot' ? 'SYSTEM_BOT' : 'PATIENT_USER'}
                                </span>
                            </div>
                            {msg.text}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="d-flex justify-content-start">
                        <div className="bg-dark bg-opacity-40 p-3 rounded-3 border border-opacity-10">
                            <div className="d-flex gap-1">
                                <span className="status-indicator status-online animate-pulse" />
                                <span className="small text-muted uppercase tracking-widest" style={{ fontSize: '9px' }}>ANALYZING...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-top border-opacity-10">
                <div className="position-relative">
                    <input
                        type="text"
                        placeholder="ENTER_COMMAND..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className="form-control-premium w-100 ps-3 pe-5 py-2 small"
                        style={{ background: 'rgba(0,0,0,0.2)' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-primary p-2"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .max-width-80 { max-width: 80%; }
                .tracking-widest { letter-spacing: 2px; }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </div>
    );

    if (inline) return ChatContent;

    return (
        <div className="fixed-bottom p-4 d-flex justify-content-end z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="position-absolute"
                        style={{ bottom: '90px', right: '24px', width: '350px', height: '500px' }}
                    >
                        {ChatContent}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-premium rounded-circle p-0 d-flex align-items-center justify-content-center glow-primary"
                style={{ width: '60px', height: '60px' }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </motion.button>
        </div>
    );
}

