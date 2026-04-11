import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { 
    Plus, List, Search, Upload, CheckCircle, ExternalLink, 
    Loader2, Calendar, BookOpen, User as UserIcon, 
    Award, ShieldCheck, PieChart, Activity, Zap, XCircle, QrCode,
    Filter, Database, Globe, AlertCircle, LayoutDashboard,
    Clock, ShieldAlert, Lock, Info, GraduationCap, Building2, Hash, FileText, Trash2, Sparkles, Split, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { institutionApi } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

const FormField = ({ name, label, icon: Icon, placeholder, type = 'text', required = true, value, onChange }) => (
    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="input-field w-full pl-10 h-12 text-sm font-bold bg-slate-50 border-transparent focus:bg-white focus:border-slate-200"
            />
        </div>
    </div>
);

const InstitutionDashboard = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [activeTab, setActiveTab] = useState('records');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(user?.authorized ?? false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [generatedQRData, setGeneratedQRData] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null); // Used for Smart Inspector
    const [uploadForm, setUploadForm] = useState({
        studentName: '', degreeName: '', branch: '', universityName: '',
        registerNumber: '', yearOfPassing: new Date().getFullYear().toString(),
        certificateNumber: '', dateOfIssue: '', document: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setProfileLoading(true);
        try {
            const [profileRes, recordsRes] = await Promise.all([
                institutionApi.getProfile(),
                institutionApi.getRecords()
            ]);
            setIsAuthorized(profileRes.data.authorized ?? profileRes.data.isAuthorized ?? false);
            setRecords(recordsRes.data);
        } catch (err) {
            console.error('Failed to sync workspace', err);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUploadChange = (e) => {
        setUploadForm({ ...uploadForm, [e.target.name]: e.target.value.toUpperCase() });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUploadForm({ ...uploadForm, document: e.target.files[0] });
        }
    };

    const handleAiExtraction = async () => {
        if (!uploadForm.document) {
            addNotification("Please provide a source document for AI processing.", "warning");
            return;
        }
        setIsExtracting(true);
        try {
            const formData = new FormData();
            formData.append('certificate', uploadForm.document);
            formData.append('verifierName', 'SYSTEM_AUTOFILL');
            const response = await institutionApi.extractAiData(formData);
            const extra = response.data.extractedData;
            
            setUploadForm(prev => ({
                ...prev,
                studentName: extra.studentName || '',
                degreeName: extra.degreeName || '',
                branch: extra.branch || '',
                universityName: extra.universityName || '',
                registerNumber: extra.registerNumber || '',
                yearOfPassing: extra.yearOfPassing || prev.yearOfPassing,
                certificateNumber: extra.certificateNumber || '',
                dateOfIssue: extra.dateOfIssue || ''
            }));
            addNotification("AI Extraction Complete: Form Populated.", "success");
        } catch (err) {
            addNotification("AI Service is currently over capacity. Please fill manually.", "error");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthorized) {
            addNotification("Authorization Required: Contact System Admin.", "error");
            return;
        }
        setIsLoading(true);
        try {
            const formData = new FormData();
            Object.keys(uploadForm).forEach(key => {
                if (key !== 'document') formData.append(key, uploadForm[key]);
            });
            formData.append('document', uploadForm.document);

            const response = await institutionApi.uploadRecord(formData);
            setRecords([response.data, ...records]);
            addNotification(`Successfully Anchored Record #${response.data.certificateNumber}`, "success");
            setGeneratedQRData(uploadForm);
            setActiveTab('records');
            setUploadForm({
                studentName: '', degreeName: '', branch: '', universityName: '',
                registerNumber: '', yearOfPassing: new Date().getFullYear().toString(),
                certificateNumber: '', dateOfIssue: '', document: null
            });
        } catch (err) {
            addNotification(err.response?.data?.error || "Anchoring failed.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (recordId) => {
        if (!window.confirm("WARNING: Removing this record will erase its local metadata. The blockchain anchor remains immutable. Continue?")) return;
        try {
            await institutionApi.deleteRecord(recordId);
            setRecords(prev => prev.filter(r => r.id !== recordId));
            addNotification("Local record metadata purged.", "success");
        } catch (err) {
            addNotification("Purge failed. Database error.", "error");
        }
    };

    const filteredRecords = records.filter(r =>
        r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const SidebarItem = ({ id, icon: Icon, label, disabled }) => (
        <button
            onClick={() => !disabled && setActiveTab(id)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
                disabled 
                ? 'text-slate-300 cursor-not-allowed opacity-50'
                : activeTab === id 
                ? 'bg-slate-900 text-white shadow-xl translate-x-2' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            <Icon className={`w-4 h-4 ${activeTab === id ? 'text-brand-primary' : 'text-slate-400'}`} />
            <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
            {disabled && <Lock className="w-3 h-3 ml-auto" />}
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Controls */}
            <aside className="lg:w-72 flex-shrink-0 space-y-10">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-6">Navigation Unit</h3>
                    <nav className="space-y-2">
                        <SidebarItem id="records" icon={Database} label="Asset Vault" />
                        <SidebarItem id="issue" icon={Zap} label="Anchor New" disabled={!isAuthorized} />
                        <SidebarItem id="analytics" icon={PieChart} label="Security Status" />
                    </nav>
                </div>

                <div className={`p-8 rounded-[2rem] border-4 relative overflow-hidden transition-all ${isAuthorized ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="absolute right-0 top-0 opacity-10 p-4"><ShieldCheck className="w-16 h-16" /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 italic">Authority Status</p>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isAuthorized ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">
                            {isAuthorized ? 'Authorized Agent' : 'Unauthorized Access'}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                        {isAuthorized ? 'Full blockchain write access granted.' : 'Contact admin for anchor permissions.'}
                    </p>
                </div>
            </aside>

            {/* Content Core */}
            <main className="flex-grow min-h-[700px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'records' ? (
                        <motion.div key="records" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-slate-100">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vested Records</h1>
                                    <p className="text-slate-500 text-sm font-medium">Managing {records.length} immutable assets on Polygon Network.</p>
                                </div>
                                <div className="relative w-full md:w-96 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-primary" />
                                    <input 
                                        placeholder="Search by student, register or cert ID..." 
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field w-full h-12 pl-12 text-sm font-bold bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-brand-primary/5"
                                    />
                                </div>
                            </div>

                            <div className="sleek-panel overflow-hidden bg-white border border-slate-100 shadow-sm rounded-[2.5rem]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Identity</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Award / Degree</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Evidence Proof</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Audit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {isLoading ? (
                                                <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-200" /></td></tr>
                                            ) : filteredRecords.length > 0 ? (
                                                filteredRecords.map((r) => (
                                                    <tr key={r.id} className="hover:bg-slate-50/80 transition-all group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200 uppercase tracking-tighter">
                                                                    {r.studentName?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 leading-tight">{r.studentName}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{r.registerNumber}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <p className="text-sm font-black text-slate-800">{r.degreeName}</p>
                                                            <p className="text-[10px] font-bold text-brand-primary uppercase mt-1 tracking-tighter">{r.branch} • CLASS OF {r.yearOfPassing}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Hash className="w-3 h-3 text-slate-300" />
                                                                    <span className="text-[10px] font-mono font-bold text-slate-500">{r.certificateNumber}</span>
                                                                </div>
                                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Anchored: {new Date(r.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <button onClick={() => setSelectedRecord(r)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(r.id)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="4" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic h-32 flex items-center justify-center">No Assets Locked in Registry</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'issue' ? (
                        <motion.div key="issue" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-4xl space-y-10">
                            <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                                <div className="p-4 bg-slate-900 text-brand-primary rounded-[1.5rem] shadow-xl"><Zap className="w-8 h-8" /></div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Anchor New Asset</h1>
                                    <p className="text-slate-500 text-sm font-medium">Issue a new cryptographic proof directly to the Ethereum Virtual Machine.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 sleek-panel p-10 bg-white border border-slate-100 shadow-sm space-y-8">
                                    <form onSubmit={handleUploadSubmit} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-10">
                                            <FormField name="studentName" label="Student Identity" icon={UserIcon} value={uploadForm.studentName} onChange={handleUploadChange} placeholder="FULL LEGAL NAME" />
                                            <FormField name="degreeName" label="Award / Degree" icon={GraduationCap} value={uploadForm.degreeName} onChange={handleUploadChange} placeholder="E.G. B.TECH" />
                                            <FormField name="branch" label="Specialization" icon={BookOpen} value={uploadForm.branch} onChange={handleUploadChange} placeholder="COMPUTER SCIENCE" />
                                            <FormField name="universityName" label="Issuing Authority" icon={Building2} value={uploadForm.universityName} onChange={handleUploadChange} placeholder="ANNA UNIVERSITY" />
                                            <FormField name="registerNumber" label="Registry ID" icon={Hash} value={uploadForm.registerNumber} onChange={handleUploadChange} placeholder="UNIQUE ID" />
                                            <FormField name="yearOfPassing" label="Year of Completion" type="number" icon={Calendar} value={uploadForm.yearOfPassing} onChange={handleUploadChange} />
                                            <FormField name="certificateNumber" label="Serial No" icon={FileText} value={uploadForm.certificateNumber} onChange={handleUploadChange} placeholder="PHYSICAL ID" />
                                            <FormField name="dateOfIssue" label="Issuance Date" type="date" icon={Calendar} value={uploadForm.dateOfIssue} onChange={handleUploadChange} />
                                        </div>

                                        <div className="pt-8 border-t border-slate-50 flex items-center justify-between gap-6">
                                            <div className="flex-grow relative">
                                                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" id="asset-upload" required />
                                                <label htmlFor="asset-upload" className="btn-secondary w-full justify-center h-12 cursor-pointer bg-slate-50 hover:bg-slate-100 border-none transition-all">
                                                    <Upload className="w-4 h-4" />
                                                    <span className="truncate font-black text-[10px] uppercase">{uploadForm.document ? uploadForm.document.name : 'Attach Physical Proof'}</span>
                                                </label>
                                            </div>

                                            <button type="button" onClick={handleAiExtraction} disabled={!uploadForm.document || isExtracting} className="btn-secondary h-12 px-6 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 disabled:opacity-50 transition-all font-black uppercase text-[10px]">
                                                {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                AI Fill
                                            </button>
                                        </div>

                                        <button type="submit" disabled={isLoading || !isAuthorized} className="btn-primary w-full h-14 bg-slate-900 border-none hover:translate-y-[-2px] transition-all shadow-2xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-brand-primary/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                                            {isLoading ? <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /><span>Syncing Ledger...</span></div> : 'COMMIT TO BLOCKCHAIN'}
                                        </button>
                                    </form>
                                </div>

                                <div className="space-y-6">
                                    <div className="sleek-panel p-8 bg-slate-50 border-none text-center">
                                        <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-6" />
                                        <h3 className="text-xl font-black text-slate-900 leading-tight">Digital QR Manifest</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-tight">A unique QR passport will be generated upon successful blockchain anchoring.</p>
                                    </div>
                                    <div className="p-6 bg-brand-primary/5 rounded-[2rem] border-2 border-brand-primary/10">
                                        <Info className="w-5 h-5 text-brand-primary mb-3" />
                                        <p className="text-[10px] font-black text-slate-600 uppercase leading-relaxed italic">
                                            "Every anchor consumes cryptographic resources. Ensure all data fields are verified against physical issuance before commitment."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                             <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                                <div className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-xl"><PieChart className="w-8 h-8" /></div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security Intel</h1>
                                    <p className="text-slate-500 text-sm font-medium">Real-time infrastructure health and asset verification metrics.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { label: 'Blockchain Proofs', value: records.length, icon: ShieldCheck, color: 'text-brand-primary' },
                                    { label: 'Network Latency', value: '18ms', icon: Zap, color: 'text-amber-500' },
                                    { label: 'Node Health', value: '99.9%', icon: Globe, color: 'text-emerald-500' }
                                ].map((s, i) => (
                                    <div key={i} className="sleek-panel p-8 bg-white border border-slate-100 shadow-sm text-center">
                                        <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6 ${s.color} border border-slate-100`}><s.icon className="w-6 h-6" /></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
                                        <p className="text-4xl font-black text-slate-900 mt-2">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* HIGH-FIDELITY SMART INSPECTOR MODAL */}
            <AnimatePresence>
                {selectedRecord && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 md:p-12 overflow-hidden">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-7xl h-full max-h-[900px] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-brand-primary shadow-2xl shadow-brand-primary/20">
                                        <Split className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Smart Inspector <span className="text-slate-300 font-medium">//</span> <span className="text-brand-primary uppercase text-sm tracking-[0.2em] font-black">{selectedRecord.registerNumber}</span></h2>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Cross-Referencing Physical Asset vs Blockchain Ledger</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedRecord(null)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl shadow-sm border border-slate-100 transition-all">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Main Body: Side-By-Side */}
                            <div className="flex-grow overflow-hidden flex flex-col lg:flex-row">
                                {/* Left: Metadata Grid */}
                                <div className="lg:w-2/5 p-10 overflow-y-auto border-r border-slate-100 bg-white">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Database className="w-4 h-4" /></div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ledger Inscription</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-y-8">
                                        {[
                                            { label: 'Student Identity', value: selectedRecord.studentName, icon: UserIcon },
                                            { label: 'Academic Award', value: selectedRecord.degreeName, icon: GraduationCap },
                                            { label: 'Branch / Specialty', value: selectedRecord.branch, icon: BookOpen },
                                            { label: 'Authorized Institution', value: selectedRecord.universityName, icon: Building2 },
                                            { label: 'Registry Serial', value: selectedRecord.certificateNumber, icon: FileText },
                                            { label: 'Year Of Merit', value: selectedRecord.yearOfPassing, icon: Calendar },
                                            { label: 'Issuance Date', value: selectedRecord.dateOfIssue, icon: Clock }
                                        ].map((f, i) => (
                                            <div key={i} className="group border-b border-slate-50 pb-6 last:border-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <f.icon className="w-3 h-3 text-slate-300 group-hover:text-brand-primary transition-colors" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none grow">{f.label}</span>
                                                </div>
                                                <div className="text-lg font-black text-slate-900 tracking-tight">{f.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-10 p-8 bg-slate-950 rounded-[2rem] shadow-inner relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Globe className="w-16 h-16 text-blue-500" /></div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Immutable Data Hash</p>
                                        <div className="font-mono text-[10px] text-blue-400/80 break-all leading-relaxed whitespace-pre-wrap">{selectedRecord.dataHash}</div>
                                        <div className="mt-6 flex items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Network Verified</span>
                                            <div className="flex-grow h-px bg-slate-800" />
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Original Document Asset */}
                                <div className="lg:w-3/5 bg-slate-100 flex flex-col relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-transparent pointer-events-none" />
                                    <div className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Original Physical Proof</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <a href={`https://gateway.pinata.cloud/ipfs/${selectedRecord.ipfsCid}`} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-6 text-[10px] bg-slate-900 text-white border-none uppercase font-black hover:translate-y-[-1px] transition-all">External View</a>
                                        </div>
                                    </div>

                                    <div className="flex-grow p-10 flex items-center justify-center">
                                        {selectedRecord.ipfsCid ? (
                                            <div className="w-full h-full min-h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex items-center justify-center shadow-slate-300">
                                                 <iframe 
                                                    src={`https://gateway.pinata.cloud/ipfs/${selectedRecord.ipfsCid}#toolbar=0`} 
                                                    className="w-full h-full"
                                                    title="PDF Preview"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center p-12 bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-300">
                                                <ShieldAlert className="w-16 h-16 text-rose-300 mx-auto mb-6" />
                                                <h3 className="text-2xl font-black text-slate-400 tracking-tight">IPFS Retrieval Fault</h3>
                                                <p className="max-w-xs mx-auto text-slate-400 text-sm mt-3 font-medium">This asset could not be synced from the decentralized gateway. Ensure the node is authorized.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Quick Manifest Footer */}
                                    <div className="p-8 border-t border-slate-200 bg-white/50 backdrop-blur-md flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                                <QRCodeSVG 
                                                    value={JSON.stringify({id: selectedRecord.registerNumber, hash: selectedRecord.dataHash})} 
                                                    size={60} level="M"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Registry ID</p>
                                                <p className="text-xs font-black text-slate-900 mt-0.5">{selectedRecord.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Signature</p>
                                            <a href={`https://sepolia.etherscan.io/tx/${selectedRecord.blockchainTxHash}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono font-bold text-brand-primary flex items-center gap-2 justify-end mt-0.5 hover:underline decoration-2 underline-offset-4">
                                                {selectedRecord.blockchainTxHash?.substring(0, 20)}... <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* QR GENERATED MODAL */}
             <AnimatePresence>
                {generatedQRData && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl text-center relative border border-slate-100">
                             <button onClick={() => setGeneratedQRData(null)} className="absolute top-8 right-8 p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                            <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <QrCode className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Anchor QR Generated</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10">Stamping metadata into physical passport</p>
                            
                            <div className="p-6 bg-white border-4 border-slate-50 rounded-[2.5rem] shadow-inner mb-10 inline-block">
                                <QRCodeSVG value={JSON.stringify(generatedQRData)} size={200} level="H" />
                            </div>
                            
                            <button onClick={() => setGeneratedQRData(null)} className="btn-primary w-full h-14 bg-slate-900 border-none font-black uppercase text-xs tracking-widest">Archive Passport</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InstitutionDashboard;
