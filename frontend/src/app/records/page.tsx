"use client";

import Sidebar from "@/components/Sidebar";
import TacticalHeader from "@/components/TacticalHeader";
import { FileText, Search, Filter, Download, Shield, Plus, MoreVertical, X, User, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingOverlay from "../../components/LoadingOverlay";
import { useState, useEffect } from "react";
import AxiosInstance from "@/lib/AxiosInstance";
import { showError, showSuccess } from "@/lib/alerts";

interface Record {
    id: number;
    file_name: string;
    file_type: string;
    file_size: string;
    uploaded_at: string;
    doctor_name: string;
    patient_username: string;
    patient_full_name: string;
    file_data: string;
}

interface Patient {
    id: number;
    name: string;
    username: string;
}

export default function RecordsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<Record[]>([]);
    const [isDoctor, setIsDoctor] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Upload Form State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState("");
    const [reportName, setReportName] = useState("");
    const [reportType, setReportType] = useState("Laboratory");
    const [base64File, setBase64File] = useState("");
    const [fileSize, setFileSize] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem('user_role');
        setIsDoctor(role === 'doctor');
        fetchRecords();
        if (role === 'doctor') {
            fetchPatients();
        }
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await AxiosInstance.get('medical-records/');
            setRecords(response.data);
        } catch (_err) {
            showError("Failed to synchronize medical vault.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await AxiosInstance.get('doctor-patients/');
            setPatients(response.data);
        } catch (err) {
            console.error("Failed to fetch patients:", err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB Limit
                showError("File size exceeds 5MB limit.");
                return;
            }
            setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBase64File(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !reportName || !base64File) {
            showError("Please complete all required fields.");
            return;
        }

        setUploading(true);
        try {
            await AxiosInstance.post('medical-records/', {
                patient: selectedPatient,
                file_name: reportName,
                file_type: reportType,
                file_size: fileSize,
                file_data: base64File
            });
            showSuccess("Clinical documentation uploaded successfully.");
            setIsUploadModalOpen(false);
            setReportName("");
            setBase64File("");
            fetchRecords();
        } catch (_err) {
            showError("Documentation upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const filteredRecords = records.filter(record =>
        record.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.patient_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="d-flex min-vh-100 bg-main">
            <AnimatePresence>
                {loading && <LoadingOverlay />}
            </AnimatePresence>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-grow-1 d-flex flex-column overflow-hidden page-container">
                <TacticalHeader title="Medical Records" onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-grow-1 p-4 p-xl-5 overflow-y-auto">
                    {/* Header Section */}
                    <div className="mb-5 d-flex justify-content-between align-items-end flex-wrap gap-4">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="d-flex align-items-center gap-2 mb-2"
                            >
                                <Shield size={14} className="text-primary" />
                                <span className="text-primary fw-bold smallest uppercase tracking-widest letter-spacing-1">Personal Healthcare Vault</span>
                            </motion.div>
                            <h2 className="fw-bold text-dark outfit display-6 mb-1 tracking-tight">Medical Workspace</h2>
                            <p className="text-muted fw-medium mb-0">Securely store and manage clinical diagnostic reports.</p>
                        </div>
                        {isDoctor && (
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="btn btn-premium d-flex align-items-center gap-2 px-4 py-3 shadow-premium transition-all hover-scale"
                            >
                                <Plus size={20} /> <span className="fw-bold">Upload Documentation</span>
                            </button>
                        )}
                    </div>

                    <div className="row g-4">
                        <div className="col-12 col-xl-8">
                            <div className="glass-container p-4 border-0 shadow-lg bg-white mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-light-subtle">
                                    <h5 className="fw-bold m-0 text-dark outfit">Clinical Reports</h5>
                                    <div className="d-flex gap-3">
                                        <div className="position-relative d-none d-lg-block">
                                            <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-primary opacity-50" size={16} />
                                            <input
                                                type="text"
                                                className="form-control-premium ps-5 py-2 border-0 bg-light bg-opacity-50"
                                                placeholder="Search by file or name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{ width: '280px', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                        <button onClick={fetchRecords} className="btn btn-light border-0 shadow-sm rounded-3 d-flex align-items-center px-3 py-2 gap-2 text-dark transition-all hover-lift">
                                            <Filter size={16} className="text-primary" />
                                            <span className="small fw-bold">Sync</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    <AnimatePresence mode="popLayout">
                                        {filteredRecords.length > 0 ? (
                                            filteredRecords.map((record, i) => (
                                                <motion.div
                                                    key={record.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="d-flex align-items-center justify-content-between p-3 rounded-4 border-0 bg-light bg-opacity-30 hover-bg-white shadow-xs transition-all cursor-pointer"
                                                >
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="p-3 rounded-4 bg-primary-soft shadow-sm">
                                                            <FileText size={24} className="text-primary" />
                                                        </div>
                                                        <div>
                                                            <h6 className="fw-bold m-0 text-dark mb-1">{record.file_name}</h6>
                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                <span className="badge bg-white shadow-xs text-primary fw-bold" style={{ fontSize: '10px' }}>{record.file_type}</span>
                                                                <span className="text-muted small">•</span>
                                                                <span className="text-muted fw-medium" style={{ fontSize: '11px' }}>
                                                                    {isDoctor ? `Patient: ${record.patient_full_name}` : `Doctor: ${record.doctor_name}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-4">
                                                        <div className="text-end d-none d-md-block">
                                                            <span className="text-dark fw-bold d-block small">{formatDate(record.uploaded_at)}</span>
                                                            <span className="text-muted fw-medium" style={{ fontSize: '10px' }}>{record.file_size}</span>
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <a href={record.file_data} target="_blank" rel="noopener noreferrer" className="btn btn-white rounded-circle p-2 shadow-sm border-0 transition-all hover-lift flex-shrink-0" title="View Document"><Eye size={16} className="text-muted" /></a>
                                                            <a href={record.file_data} download={record.file_name} className="btn btn-white rounded-circle p-2 shadow-sm border-0 transition-all hover-lift flex-shrink-0" title="Download Document"><Download size={16} className="text-primary" /></a>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="py-5 text-center">
                                                <FileText size={48} className="text-muted opacity-25 mb-3" />
                                                <h6 className="fw-bold text-dark">{loading ? "Synchronizing Vault..." : "No clinical documentation found."}</h6>
                                                <p className="text-muted small mt-2">Authenticated users can view verified reports here.</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-xl-4">
                            <div className="glass-container p-4 border-0 shadow-lg bg-white mb-4">
                                <h6 className="fw-bold mb-4 text-dark outfit d-flex align-items-center gap-2 uppercase smallest tracking-wider opacity-75">
                                    <Shield size={18} className="text-primary" />
                                    Data Protection
                                </h6>
                                <div className="p-4 rounded-4 bg-primary-soft border border-primary border-opacity-10 mb-4 shadow-sm">
                                    <p className="text-dark small fw-bold mb-3">Health Compliance Secured</p>
                                    <p className="text-muted small m-0 lh-lg fw-medium">Medical documentation is safeguarded with end-to-end encryption. Only verified medical practitioners can upload new diagnostic reports to your vault.</p>
                                </div>
                                <div className="p-3 rounded-4 bg-light border border-light-subtle d-flex align-items-center gap-3">
                                    <div className="p-2 rounded-circle bg-white shadow-xs">
                                        <Plus size={16} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="m-0 small fw-bold text-dark">Verified Access Only</p>
                                        <p className="m-0 smallest text-muted">Doctors must be authenticated.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 2000 }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploadModalOpen(false)}
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-container bg-white p-4 p-xl-5 border-0 shadow-2xl position-relative overflow-hidden"
                            style={{ width: '100%', maxWidth: '500px', borderRadius: '28px' }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h4 className="fw-bold text-dark outfit m-0 tracking-tight">Upload Diagnostics</h4>
                                    <p className="text-muted small m-0">Send medical report to patient vault</p>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="btn btn-light rounded-circle p-2 border-0"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleUpload}>
                                <div className="mb-4">
                                    <label className="form-label smallest fw-bold uppercase tracking-wider text-primary mb-2">Target Patient</label>
                                    <div className="position-relative mb-2">
                                        <User className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} style={{ pointerEvents: 'none' }} />
                                        <select
                                            className="form-select form-control-premium ps-5 py-3 border-light shadow-sm"
                                            value={selectedPatient}
                                            onChange={(e) => setSelectedPatient(e.target.value)}
                                            required
                                        >
                                            <option value="">Select an active patient...</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} (@{p.username})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-12 col-md-6 mb-2">
                                        <label className="form-label smallest fw-bold uppercase tracking-wider text-primary mb-2">Report Name</label>
                                        <input
                                            type="text"
                                            className="form-control-premium w-100 py-3 border-light shadow-sm"
                                            placeholder="e.g. Annual_Blood_Work"
                                            value={reportName}
                                            onChange={(e) => setReportName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-12 col-md-6 mb-2">
                                        <label className="form-label smallest fw-bold uppercase tracking-wider text-primary mb-2">Classification</label>
                                        <select
                                            className="form-select form-control-premium w-100 py-3 border-light shadow-sm"
                                            value={reportType}
                                            onChange={(e) => setReportType(e.target.value)}
                                        >
                                            <option value="Laboratory">Laboratory Analysis</option>
                                            <option value="Imaging">Radiological Imaging</option>
                                            <option value="Prescription">Medical Prescription</option>
                                            <option value="Checkup">General Checkup</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label className="form-label smallest fw-bold uppercase tracking-wider text-primary mb-2">Digital Documentation</label>
                                    <div className="upload-area p-4 border-2 border-dashed rounded-4 text-center cursor-pointer transition-all hover-bg-light">
                                        <input
                                            type="file"
                                            id="report-file"
                                            className="d-none"
                                            accept=".pdf,.jpg,.jpeg,.png,.zip"
                                            onChange={handleFileChange}
                                        />
                                        <label htmlFor="report-file" className="m-0 cursor-pointer w-100">
                                            <div className="p-3 rounded-circle bg-primary-soft text-primary d-inline-block mb-3">
                                                <Plus size={24} />
                                            </div>
                                            <p className="fw-bold mb-1 text-dark small">{base64File ? "File selected successfully" : "Click to browse clinical files"}</p>
                                            <p className="smallest text-muted m-0">{base64File ? reportName : "PDF, Images or ZIP (Max 5MB)"}</p>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="btn btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-premium"
                                >
                                    {uploading ? <div className="spinner-border spinner-border-sm" /> : <><Shield size={18} /> Authorize & Upload</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .hover-bg-light:hover { background: #F8FAFC !important; }
                .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .hover-scale:hover { transform: scale(1.02); }
                .upload-area { border-color: #E2E8F0; }
                .upload-area:hover { border-color: var(--primary); background: rgba(70, 194, 222, 0.05) !important; }
            `}</style>
        </div>
    );
}
