import React, { useState, useEffect } from 'react';
import { 
    Shield, Users, Activity, AlertTriangle, Clock, 
    CheckCircle, XCircle, MoreVertical, Globe, 
    Zap, Cpu, Server, ExternalLink, Search, Filter, Loader2,
    Settings, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { adminApi } from '../services/api';

const AdminDashboard = () => {
    const { addNotification } = useNotification();
    const [logs, setLogs] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [records, setRecords] = useState([]);
    const [systemStats, setSystemStats] = useState({ institutions: 0, records: 0, verifications: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch stats and lists independently to prevent one failure from blocking others
            const results = await Promise.allSettled([
                adminApi.getVerifications(),
                adminApi.getInstitutions(),
                adminApi.getRecords(),
                adminApi.getStats()
            ]);

            const [logsRes, instRes, recordsRes, statsRes] = results;

            if (logsRes.status === 'fulfilled') {
                setLogs(logsRes.value.data.map(log => ({
                    id: log.id,
                    verifier: log.verifierName || 'Anonymous',
                    certId: log.certificateId,
                    status: log.verificationStatus,
                    time: new Date(log.timestamp).toLocaleString(),
                    type: 'External Audit'
                })));
            }

            let recordCountByInst = {};
            if (recordsRes.status === 'fulfilled') {
                setRecords(recordsRes.value.data);
                recordCountByInst = recordsRes.value.data.reduce((acc, rec) => {
                    const instId = rec.institution?.id || rec.institutionId;
                    if (instId) acc[instId] = (acc[instId] || 0) + 1;
                    return acc;
                }, {});
            }

            if (instRes.status === 'fulfilled') {
                setInstitutions(instRes.value.data.map(inst => ({
                    id: inst.id,
                    name: inst.name,
                    email: inst.email,
                    walletAddress: inst.walletAddress,
                    records: recordCountByInst[inst.id] || 0,
                    status: inst.authorized ? 'ACTIVE' : (inst.walletAddress ? 'PENDING' : 'INCOMPLETE')
                })));
            }

            if (statsRes.status === 'fulfilled') {
                setSystemStats(statsRes.value.data);
            }
        } catch (err) {
            console.error("Failed to fetch admin data", err);
            addNotification("Infrastructure data load had issues.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAuthorize = async (instId) => {
        setActionLoading(instId);
        try {
            await adminApi.authorizeInstitution(instId);
            setInstitutions(prev => prev.map(inst => 
                inst.id === instId ? { ...inst, status: 'ACTIVE' } : inst
            ));
            addNotification("Institution authorized successfully.", "success");
        } catch (error) {
            const msg = error.response?.data?.error || "Failed to authorize institution.";
            addNotification(msg, "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevoke = async (instId) => {
        setActionLoading(instId);
        try {
            await adminApi.revokeInstitution(instId);
            setInstitutions(prev => prev.map(inst => 
                inst.id === instId ? { ...inst, status: 'REVOKED' } : inst
            ));
            addNotification("Institution access revoked.", "warning");
        } catch (error) {
            const msg = error.response?.data?.error || "Failed to revoke institution.";
            addNotification(msg, "error");
        } finally {
            setActionLoading(null);
        }
    };

    const stats = [
        { label: 'Institutions', val: systemStats.institutions.toString(), icon: Globe, detail: 'Registered entities' },
        { label: 'Blockchain Proofs', val: systemStats.records.toString(), icon: ShieldCheck, detail: 'Immutable records' },
        { label: 'Total Audits', val: systemStats.verifications.toString(), icon: Activity, detail: 'Network verifications' },
        { label: 'Alerts', val: logs.filter(l => l.status === 'TAMPERED').length.toString(), icon: AlertTriangle, detail: 'Failed handshakes' },
    ];

    if (isLoading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-slate-200 animate-spin" />
                <p className="text-sm font-medium text-slate-400">Loading infrastructure...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Console</h1>
                    <p className="text-slate-500 text-sm">Governance and monitoring for the EtherVault protocol.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Protocol Active</span>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="sleek-panel p-6 bg-white shadow-sm border border-slate-100">
                        <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-slate-100 text-slate-400">
                            <s.icon className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{s.val}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{s.detail}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Entities Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Registered Entities</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input placeholder="Search..." className="input-field pl-9 py-1.5 text-xs w-48" />
                        </div>
                    </div>
                    
                    <div className="sleek-panel bg-white overflow-hidden border border-slate-100">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Institution</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Proofs</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {institutions.map(inst => (
                                    <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                                                    {inst.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{inst.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{inst.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-800">{inst.records}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                inst.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 
                                                inst.status === 'REVOKED' ? 'bg-rose-50 text-rose-600' :
                                                'bg-amber-50 text-amber-600'
                                            }`}>
                                                {inst.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {actionLoading === inst.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleAuthorize(inst.id)} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest disabled:opacity-30" disabled={inst.status === 'ACTIVE'}>Auth</button>
                                                    <button onClick={() => handleRevoke(inst.id)} className="text-[10px] font-bold text-rose-500 hover:underline uppercase tracking-widest disabled:opacity-30" disabled={inst.status === 'REVOKED'}>Revoke</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Feed */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                    <div className="sleek-panel bg-white p-2 divide-y divide-slate-50 border border-slate-100">
                        {logs.slice(0, 8).map((log) => (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        log.status === 'AUTHENTIC' ? 'bg-emerald-50 text-emerald-500' :
                                        log.status === 'TAMPERED' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        {log.status === 'AUTHENTIC' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{log.verifier}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{log.time}</p>
                                    </div>
                                </div>
                                <ExternalLink className="w-3 h-3 text-slate-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
