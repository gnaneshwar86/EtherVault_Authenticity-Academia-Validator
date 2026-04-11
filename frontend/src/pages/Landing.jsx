import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ShieldCheck, ArrowRight, Search, Zap, Globe, Lock, Cpu,
    Upload, FileText, CheckCircle2, XCircle, Loader2,
    GraduationCap, Building, UserCheck, ChevronDown,
    Star, TrendingUp, Shield, Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { verifyApi } from '../services/api';

/* ─────────────────────────────── helpers ─────────────────────────────── */

const CountUp = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = end / (duration * 60);
        const id = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(id); }
            else setCount(Math.floor(start));
        }, 1000 / 60);
        return () => clearInterval(id);
    }, [inView, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─────────────────────────────── component ─────────────────────────────── */

const Landing = () => {
    const { isAuthenticated, user } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    /* Quick-verify state */
    const [qvFile, setQvFile] = useState(null);
    const [qvName, setQvName] = useState('');
    const [qvDrag, setQvDrag] = useState(false);
    const [qvLoading, setQvLoading] = useState(false);
    const [qvResult, setQvResult] = useState(null); 
    const fileInputRef = useRef(null);

    /* Drag handlers */
    const onDrag = useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        setQvDrag(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        setQvDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) { setQvFile(f); setQvResult(null); }
    }, []);

    const onFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) { setQvFile(f); setQvResult(null); }
    };

    const handleQuickVerify = async () => {
        if (!qvFile) return;
        setQvLoading(true);
        setQvResult(null);
        try {
            const fd = new FormData();
            fd.append('certificate', qvFile);
            fd.append('verifierName', qvName || 'Homepage Quick-Check');
            const res = await verifyApi.verifyCertificate(fd);
            setQvResult(res.data.isAuthentic ? 'authentic' : 'tampered');
            addNotification(
                res.data.isAuthentic ? "Certificate verified successfully!" : "Warning: This certificate appears to be tampered with.",
                res.data.isAuthentic ? "success" : "warning"
            );
        } catch (err) {
            const msg = err.response?.data?.error || "Verification failed. System error.";
            addNotification(msg, "error");
        } finally {
            setQvLoading(false);
        }
    };

    const resetQv = () => { setQvFile(null); setQvResult(null); setQvName(''); };

    const stats = [
        { label: 'Certificates Anchored', value: 48200, suffix: '+', icon: Shield },
        { label: 'Partner Institutions', value: 120, suffix: '+', icon: Building },
        { label: 'Verifications / Day', value: 3800, suffix: '+', icon: Activity },
        { label: 'Fraud Attempts Blocked', value: 99, suffix: '%', icon: ShieldCheck },
    ];

    const dashboardPath = user?.role === 'ADMIN' ? '/admin' : '/institution';

    return (
        <div className="space-y-32 pb-32">

            {/* ════════════ HERO ════════════ */}
            <section className="relative pt-20 pb-16 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Ethereum Network Integrated
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-slate-900 max-w-4xl"
                >
                    Securing Academic Excellence with <span className="text-blue-600">Blockchain Trust.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-12"
                >
                    EtherVault creates an immutable record for educational credentials using SHA-256 hashing and Ethereum smart contracts. Simple, secure, and permanent.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {isAuthenticated ? (
                        <Link to={dashboardPath}>
                            <button className="btn-primary h-12 px-8">
                                Go to Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/verify">
                                <button className="btn-primary h-12 px-8">
                                    Verify a Document <Search className="w-4 h-4" />
                                </button>
                            </Link>
                            <Link to="/register">
                                <button className="btn-secondary h-12 px-8">
                                    Institution Join <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </>
                    )}
                </motion.div>
            </section>

            {/* ════════════ LIVE STATS ════════════ */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-10 text-center hover:bg-slate-50 transition-colors">
                        <p className="text-3xl font-bold text-slate-900 mb-1">
                            <CountUp end={s.value} suffix={s.suffix} />
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                    </div>
                ))}
            </section>

            {/* ════════════ QUICK-VERIFY ════════════ */}
            <section className="sleek-panel overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-center">
                        <div className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">Instant Access</div>
                        <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
                            Verify in real-time.
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-md leading-relaxed">
                            No account required. Simply upload a document and we'll check its cryptographic validity against the blockchain in seconds.
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Universal OCR Extraction',
                                'SHA-256 Fingerprinting',
                                'Blockchain Audit Trail',
                            ].map((t, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="p-12 lg:p-16 bg-slate-50/50">
                        <AnimatePresence mode="wait">
                            {qvResult ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                                >
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm ${qvResult === 'authentic' ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                                        {qvResult === 'authentic' ? <CheckCircle2 className="w-10 h-10 text-emerald-500" /> : <XCircle className="w-10 h-10 text-rose-500" />}
                                    </div>
                                    <div>
                                        <p className={`text-2xl font-bold tracking-tight ${qvResult === 'authentic' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {qvResult === 'authentic' ? 'Document Authentic' : 'Verification Failed'}
                                        </p>
                                        <p className="text-slate-500 text-sm mt-2 max-w-xs">
                                            {qvResult === 'authentic' ? 'The blockchain hash matches the document contents.' : 'The document may have been altered or is not in our system.'}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={resetQv} className="btn-secondary text-xs px-4">Clear</button>
                                        <Link to="/verify"><button className="btn-primary text-xs px-4">Full Details</button></Link>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="upload" className="space-y-6 h-full flex flex-col justify-center">
                                    <div
                                        onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
                                        onClick={() => !qvFile && fileInputRef.current?.click()}
                                        className={`flex-grow min-h-[240px] rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-4 py-8
                                            ${qvDrag ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'}
                                            ${qvFile ? 'border-blue-500 bg-blue-50' : ''}`}
                                    >
                                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={onFileChange} />
                                        {qvFile ? (
                                            <>
                                                <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                                                    <FileText className="w-8 h-8 text-blue-500" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800 truncate px-4 max-w-full">{qvFile.name}</p>
                                                <button onClick={(e) => { e.stopPropagation(); setQvFile(null); }} className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-600 transition-colors">Change File</button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <Upload className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <div className="text-center px-4">
                                                    <p className="font-semibold text-slate-900">Upload Certificate</p>
                                                    <p className="text-slate-400 text-xs mt-1">PDF or image supported</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleQuickVerify}
                                        disabled={!qvFile || qvLoading}
                                        className={`btn-accent w-full h-12 ${(!qvFile || qvLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {qvLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Blockchain Verification'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* ════════════ FEATURES ════════════ */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {[
                    { icon: Lock, title: 'Tamper-Proof Storage', desc: 'Securely hash records and store them on the Ethereum blockchain for permanent accessibility.' },
                    { icon: Globe, title: 'Global Recognition', desc: 'Verify institutions and students anywhere in the world without central intermediaries.' },
                    { icon: UserCheck, title: 'Smart Verification', desc: 'Our OCR technology automatically extracts data to verify physical certificates against digitised logs.' }
                ].map((f, i) => (
                    <div key={i} className="sleek-card p-10 flex flex-col items-center group">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors border border-slate-100">
                            <f.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default Landing;
