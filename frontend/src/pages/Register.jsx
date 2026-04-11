import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { User, Mail, Lock, Wallet, ArrowRight, Loader2, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        walletAddress: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            addNotification("Passwords do not match", "error");
            return;
        }
        setIsLoading(true);

        try {
            const response = await authApi.registerInstitution({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                walletAddress: formData.walletAddress,
            });

            const { token, id, name, email, role, authorized } = response.data;
            const normalizedRole = role.replace('ROLE_', '');
            login({ id, name, email, role: normalizedRole, authorized }, token);
            addNotification("Welcome to EtherVault! Your institution is now registered.", "success");
            navigate('/institution');
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            addNotification(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-12">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="sleek-panel p-10 bg-white">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Institution</h1>
                            <p className="text-slate-500 text-sm mt-1">Register for the decentralised trust network.</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 shadow-sm">
                            <Target className="w-5 h-5 text-slate-900" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Institution Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Stanford University"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="input-field w-full pl-10 h-11 text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Official Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="admin@institution.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="input-field w-full pl-10 h-11 text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="input-field w-full pl-10 h-11 text-sm transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 ml-1">Confirm</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="input-field w-full pl-10 h-11 text-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Wallet Address (Optional)</label>
                            <div className="relative">
                                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="walletAddress"
                                    placeholder="0x..."
                                    value={formData.walletAddress}
                                    onChange={handleChange}
                                    className="input-field w-full pl-10 h-11 text-sm transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full h-11 mt-4 text-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Complete Registration</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center border-t border-slate-50 pt-8">
                        <p className="text-slate-500 text-xs">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
