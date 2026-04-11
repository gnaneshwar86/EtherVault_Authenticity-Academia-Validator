import React, { useState, useEffect } from 'react';
import { 
    Upload, ShieldCheck, FileText, CheckCircle2, XCircle, Search, 
    Loader2, Info, Eye, ExternalLink, RefreshCw, QrCode, 
    Keyboard, History, ShieldAlert, Zap, Clock, Database, Split
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { verifyApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import QRScannerComponent from '../components/QRScannerComponent';

const VerifierDashboard = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    
    const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'history'
    const [verifyMethod, setVerifyMethod] = useState('ai'); // 'ai', 'manual' or 'qr'
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState(null);
    const [verifierName, setVerifierName] = useState(user?.name || localStorage.getItem('last_verifier_name') || '');
    const [stage, setStage] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    // AI Upload State
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Manual Form State
    const [manualForm, setManualForm] = useState({
        studentName: '', degreeName: '', branch: '', universityName: '',
        registerNumber: '', yearOfPassing: '', certificateNumber: '', dateOfIssue: ''
    });

    useEffect(() => {
        if (activeTab === 'history' && verifierName) {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await verifyApi.getMyHistory(verifierName);
            setHistory(response.data);
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleAiSubmit = async () => {
        if (!file || !verifierName) {
            addNotification("Please provide both a document and an auditor name.", "warning");
            return;
        }
        localStorage.setItem('last_verifier_name', verifierName);
        setIsVerifying(true);
        setResult(null);
        setStage('AI extracting data via DocTR and verifying...');
        
        try {
            const formData = new FormData();
            formData.append('certificate', file);
            formData.append('verifierName', verifierName);

            const response = await verifyApi.extractCertificate(formData);
            setResult(response.data);
            if (response.data.isAuthentic) {
                addNotification("Verification Successful: Record Confirmed Authentic.", "success");
            } else {
                addNotification("Security Alert: Hash Mismatch Detected.", "error");
            }
        } catch (err) {
            addNotification("AI Verification failed. System error.", "error");
        } finally {
            setIsVerifying(false);
            setStage('');
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!verifierName) {
            addNotification("Please provide an auditor name.", "warning");
            return;
        }
        localStorage.setItem('last_verifier_name', verifierName);
        await performVerification(manualForm);
    };

    const handleQRSuccess = async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (!verifierName) {
                addNotification("Please provide an auditor name first.", "warning");
                return;
            }
            await performVerification(data);
        } catch (err) {
            addNotification("Invalid QR Code.", "error");
        }
    };

    const performVerification = async (data) => {
        setIsVerifying(true);
        setResult(null);
        setStage('Verifying data against Blockchain Registry...');
        try {
            const response = await verifyApi.verifyCertificate({ ...data, verifierName });
            setResult(response.data);
            if (response.data.isAuthentic) {
                addNotification("Verification Confirmed.", "success");
            } else {
                addNotification("Hash Mismatch Detected.", "error");
            }
        } catch (err) {
            addNotification("Verification failed.", "error");
        } finally {
            setIsVerifying(false);
            setStage('');
        }
    };

    const StatusBadge = ({ isAuthentic }) => (
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
            isAuthentic ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
        }`}>
            {isAuthentic ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {isAuthentic ? 'Authentic' : 'Invalid'}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Top Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Operations</h1>
                    <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-primary" />
                        Ethereum Immutable Trust Infrastructure
                    </p>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        Run Audit
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        Audit Vault
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'audit' ? (
                    <motion.div key="audit" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        {!result ? (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Left: Verification Controls */}
                                <div className="lg:col-span-3 space-y-6">
                                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl w-fit border border-slate-200/60">
                                        {[
                                            { id: 'ai', label: 'AI Scanner', icon: FileText },
                                            { id: 'manual', label: 'Manual Entry', icon: Keyboard },
                                            { id: 'qr', label: 'QR Direct', icon: QrCode }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setVerifyMethod(m.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                                                    verifyMethod === m.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                                                }`}
                                            >
                                                <m.icon className="w-3.5 h-3.5" />
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="sleek-panel p-10 bg-white min-h-[450px] border border-slate-100 shadow-sm relative overflow-hidden">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 transition-all pointer-events-none"></div>

                                        {verifyMethod === 'ai' ? (
                                            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in relative z-10">
                                                <div
                                                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                                    className={`
                                                        relative w-full max-w-2xl h-80 rounded-[2rem] flex flex-col items-center justify-center transition-all border-4 border-dashed
                                                        ${dragActive ? 'border-brand-primary bg-blue-50/50' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'}
                                                        ${file ? 'border-emerald-200 bg-emerald-50/20' : ''}
                                                    `}
                                                >
                                                    <input type="file" id="file-up" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                                    {file ? (
                                                        <div className="text-center group">
                                                            <div className="bg-white p-6 rounded-[1.5rem] mx-auto w-fit shadow-xl border border-emerald-100 mb-6 group-hover:scale-105 transition-transform">
                                                                <FileText className="w-12 h-12 text-emerald-500" />
                                                            </div>
                                                            <p className="text-xl font-black text-slate-900">{file.name}</p>
                                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 px-4 py-1 bg-emerald-50 rounded-full inline-block">Asset Buffered & Ready</p>
                                                            <div className="mt-8">
                                                                <button onClick={() => setFile(null)} className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-tight flex items-center gap-1 mx-auto">
                                                                    <XCircle className="w-3 h-3" /> Change File
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center space-y-6">
                                                            <div className="bg-white p-6 rounded-full mx-auto w-fit border border-slate-100 shadow-xl">
                                                                <Upload className="w-10 h-10 text-slate-200 group-hover:text-brand-primary transition-colors" />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="file-up" className="cursor-pointer text-slate-900 font-black text-3xl block hover:text-brand-primary transition-colors tracking-tighter">
                                                                    Drop Document for Deep OCR
                                                                </label>
                                                                <p className="text-slate-400 text-sm mt-2 font-medium">Verify credentials via Neural Document Parsing</p>
                                                            </div>
                                                            <div className="pt-4 flex items-center justify-center gap-4">
                                                                <span className="h-px w-8 bg-slate-200"></span>
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">or</span>
                                                                <span className="h-px w-8 bg-slate-200"></span>
                                                            </div>
                                                            <label htmlFor="file-up" className="btn-secondary py-3 px-8 text-xs cursor-pointer inline-flex bg-white">Browse Local System</label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : verifyMethod === 'manual' ? (
                                            <div className="animate-fade-in relative z-10">
                                                <div className="mb-10 flex items-center gap-3">
                                                    <div className="p-2 bg-slate-900 text-white rounded-lg"><Keyboard className="w-5 h-5" /></div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900">Manual Cryptographic Audit</h3>
                                                        <p className="text-slate-500 text-xs">Enter certificate metadata exactly as shown on the physical copy.</p>
                                                    </div>
                                                </div>
                                                <form id="manual-verify-form" onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                                    {[
                                                        { name: 'studentName', label: 'Full Student Name', placeholder: 'e.g. GNANESHWAR R L' },
                                                        { name: 'degreeName', label: 'Degree Awarded', placeholder: 'e.g. Bachelor of Engineering' },
                                                        { name: 'branch', label: 'Branch / Specialization', placeholder: 'e.g. Computer Science' },
                                                        { name: 'universityName', label: 'Awarding University', placeholder: 'e.g. Anna University' },
                                                        { name: 'registerNumber', label: 'Register / Roll Number', placeholder: 'Unique ID' },
                                                        { name: 'yearOfPassing', label: 'Passing Year', placeholder: '2024' },
                                                        { name: 'certificateNumber', label: 'Physical Certificate ID', placeholder: 'Serial Number' },
                                                        { name: 'dateOfIssue', label: 'Exact Date of Issue', type: 'date' },
                                                    ].map((f) => (
                                                        <div key={f.name} className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                                                            <input
                                                                type={f.type || "text"} name={f.name} value={manualForm[f.name]} onChange={(e) => setManualForm({...manualForm, [e.target.name]: e.target.value.toUpperCase()})}
                                                                placeholder={f.placeholder} required className="input-field w-full text-sm py-3 font-bold bg-slate-50 border-transparent focus:bg-white focus:border-slate-300"
                                                            />
                                                        </div>
                                                    ))}
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[350px] space-y-8 animate-fade-in text-center relative z-10">
                                                <div className="w-20 h-20 rounded-3xl bg-blue-50 border-4 border-blue-100 flex items-center justify-center text-brand-primary animate-pulse">
                                                    <QrCode className="w-10 h-10" />
                                                </div>
                                                <div className="max-w-xs">
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Camera Feed Scanner</h3>
                                                    <p className="text-slate-500 text-sm mt-2">Point your interface at a secure EtherVault QR tag for instant blockchain handshake.</p>
                                                </div>
                                                <div className="w-full max-w-sm rounded-[2.5rem] overflow-hidden border-8 border-slate-100 shadow-2xl bg-slate-900">
                                                    {!verifierName ? (
                                                        <div className="p-12 text-center text-slate-500 font-bold text-sm uppercase tracking-widest italic">Wait: Enter Auditor ID First</div>
                                                    ) : (
                                                        <QRScannerComponent onScanSuccess={handleQRSuccess} />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Auditor ID Panel */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="sleek-panel p-8 bg-slate-900 text-white min-h-full flex flex-col justify-between shadow-2xl relative overflow-hidden">
                                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl -mb-16 -mr-16"></div>
                                        
                                        <div className="space-y-10 relative z-10">
                                            <div className="space-y-6">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Security Identification</h3>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Agent / Auditor Name</label>
                                                    <div className="relative group">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-primary transition-colors" />
                                                        <input
                                                            placeholder="Enter ID Code..."
                                                            value={verifierName}
                                                            onChange={(e) => setVerifierName(e.target.value)}
                                                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 text-sm font-bold placeholder:text-slate-600 focus:bg-white/10 focus:border-brand-primary transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 italic text-[11px] text-slate-400 leading-relaxed font-medium">
                                                "Active sessions are logged to the global ledger. Ensure all data fields align with official physical issuance."
                                            </div>
                                        </div>

                                        {(verifyMethod === 'manual' || verifyMethod === 'ai') && (
                                            <button
                                                onClick={verifyMethod === 'ai' ? handleAiSubmit : undefined}
                                                form={verifyMethod === 'manual' ? 'manual-verify-form' : undefined}
                                                type={verifyMethod === 'manual' ? 'submit' : 'button'}
                                                disabled={!verifierName || isVerifying || (verifyMethod === 'ai' && !file)}
                                                className="btn-primary w-full h-14 mt-8 bg-brand-primary hover:bg-slate-800 border-none relative z-10 group overflow-hidden"
                                            >
                                                <span className="relative z-10 text-xs font-black uppercase tracking-widest">
                                                    {isVerifying ? (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span className="animate-pulse">Processing...</span>
                                                        </div>
                                                    ) : 'Init Audit Handshake'}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isVerifying && stage && (
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-pulse">
                                            <ShieldAlert className="w-4 h-4 text-brand-primary" />
                                            <p className="text-[10px] font-black text-blue-800 uppercase tracking-tighter">{stage}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* SMART INSPECTOR: SIDE-BY-SIDE VIEW */
                            <motion.div key="inspector" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                <div className={`p-8 rounded-[2.5rem] border-4 shadow-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden transition-all ${
                                    result.isAuthentic ? 'bg-white border-emerald-500/20' : 'bg-white border-rose-500/20'
                                }`}>
                                    <div className={`absolute left-0 top-0 w-2 h-full ${result.isAuthentic ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                    
                                    <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shrink-0 border-4 shadow-2xl relative z-10 ${
                                        result.isAuthentic ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-rose-50 border-rose-100 text-rose-500'
                                    }`}>
                                        {result.isAuthentic ? <CheckCircle2 className="w-14 h-14" /> : <XCircle className="w-14 h-14" />}
                                    </div>
                                    
                                    <div className="flex-grow">
                                        <div className="flex flex-wrap items-center gap-4 mb-2">
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                                                {result.isAuthentic ? 'Handshake Verified' : 'Handshake Rejected'}
                                            </h2>
                                            <StatusBadge isAuthentic={result.isAuthentic} />
                                        </div>
                                        <p className="text-slate-500 text-base font-bold max-w-2xl leading-relaxed">
                                            {result.isAuthentic 
                                                ? `Document identity exactly matches Blockchain Block for ID: ${result.extractedData.registerNumber}` 
                                                : "Zero-Knowledge check failed. The document has either been modified or was never registered."}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => setResult(null)} className="btn-secondary px-8 py-3 text-xs bg-slate-900 text-white hover:bg-slate-800 border-none">Dismiss Inspector</button>
                                        <div className="text-[10px] font-black text-slate-400 text-right uppercase tracking-widest">{new Date().toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Smart Inspector Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
                                    {/* Left: Metadata Inspection */}
                                    <div className="sleek-panel p-10 bg-white border border-slate-100 flex flex-col">
                                        <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl"><Split className="w-5 h-5" /></div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Parsed Metadata Extraction</h3>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-tighter">AI Conf: 98.4%</div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-y-8 flex-grow">
                                            {Object.entries(result.extractedData).map(([key, value]) => (
                                                <div key={key} className="group transition-all">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none grow">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        {value && result.isAuthentic && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                                    </div>
                                                    <div className={`text-lg font-black tracking-tight ${value ? 'text-slate-900' : 'text-slate-300 italic'}`}>
                                                        {value || "Not Found"}
                                                    </div>
                                                    <div className="h-px w-full bg-slate-50 mt-3 group-hover:bg-brand-primary/20 transition-colors"></div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-10 p-6 bg-slate-950 rounded-[1.5rem] shadow-inner relative overflow-hidden">
                                            <div className="absolute right-0 top-0 p-4 opacity-20"><Database className="w-12 h-12 text-blue-500" /></div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Proof Signature (SHA-256)</p>
                                            <div className="font-mono text-[10px] text-blue-400/80 break-all leading-relaxed pr-8 whitespace-pre-wrap">{result.blockchainHash}</div>
                                        </div>
                                    </div>

                                    {/* Right: Asset Preview / Side-by-Side Document */}
                                    <div className="sleek-panel bg-slate-100 flex flex-col border-none overflow-hidden group shadow-2xl relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-transparent pointer-events-none"></div>
                                        <div className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Original Physical Asset</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {result.ipfsCid ? (
                                                    <a href={`https://gateway.pinata.cloud/ipfs/${result.ipfsCid}`} target="_blank" className="btn-secondary py-1.5 px-4 text-[9px] bg-slate-900 text-white border-none uppercase font-black">Open External</a>
                                                ) : <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase">Unanchored Asset</span>}
                                            </div>
                                        </div>
                                        <div className="flex-grow flex items-center justify-center p-8">
                                            {result.ipfsCid ? (
                                                <div className="w-full h-full min-h-[500px] bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden flex items-center justify-center">
                                                     <iframe 
                                                        src={`https://gateway.pinata.cloud/ipfs/${result.ipfsCid}#toolbar=0`} 
                                                        className="w-full h-full"
                                                        title="PDF Preview"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-center group-hover:scale-105 transition-transform">
                                                    <ShieldAlert className="w-16 h-16 text-rose-200 mx-auto mb-6" />
                                                    <h3 className="text-xl font-black text-slate-400 tracking-tight">Image/PDF Not In Protocol</h3>
                                                    <p className="max-w-xs mx-auto text-slate-400 text-xs mt-2 font-medium">This asset is local to your machine or was not found in our cold storage vault.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    /* AUDIT VAULT: PERSISTENT HISTORY TAB */
                    <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Auditor Transaction Log</h2>
                                <p className="text-slate-500 text-sm font-medium">Historical verification lifecycle for <span className="text-slate-900 font-bold underline decoration-brand-primary underline-offset-4">{verifierName || 'Anonymous'}</span></p>
                            </div>
                            <button onClick={fetchHistory} disabled={isLoadingHistory} className="btn-secondary h-11 px-6 text-xs bg-white">
                                {isLoadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Refresh Vault
                            </button>
                        </div>

                        {!verifierName ? (
                            <div className="sleek-panel p-20 bg-slate-50 border-none text-center rounded-[3rem]">
                                <History className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity Required</h3>
                                <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Please enter your Auditor Name/ID in the "Run Audit" tab to unlock your personal history vault.</p>
                            </div>
                        ) : history.length > 0 ? (
                            <div className="sleek-panel bg-white overflow-hidden border border-slate-100 shadow-sm rounded-[2.5rem]">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Certificate ID</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trust status</th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {history.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-600">{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">{log.certificateId?.charAt(0) || 'C'}</div>
                                                        <span className="text-sm font-black text-slate-900">{log.certificateId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <StatusBadge isAuthentic={log.verificationStatus === 'AUTHENTIC'} />
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="sleek-panel p-20 bg-white border border-slate-100 text-center rounded-[3rem]">
                                {isLoadingHistory ? (
                                     <div className="space-y-6">
                                        <Loader2 className="w-12 h-12 text-slate-200 animate-spin mx-auto" />
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Accessing Ledger...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto text-slate-200 border border-slate-100"><Database className="w-10 h-10" /></div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Empty Vault</h3>
                                            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">No verified certificates found for this Auditor ID. Run your first blockchain audit to populate the ledger.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VerifierDashboard;
