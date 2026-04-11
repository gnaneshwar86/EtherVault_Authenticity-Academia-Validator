import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated, user } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    // Use effect to navigate once the auth state is confirmed
    React.useEffect(() => {
        if (isAuthenticated && user?.role) {
            const role = user.role.replace('ROLE_', '');
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'INSTITUTION') navigate('/institution');
            else navigate('/verify');
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authApi.login({ email, password });
            const { token, id, name, email: userEmail, role, authorized } = response.data;
            const normalizedRole = role.replace('ROLE_', '');
            
            // 1. Just store the state and token – the useEffect above will handle navigation once confirmed
            login({ id, name, email: userEmail, role: normalizedRole, authorized }, token);
            addNotification(`Welcome back, ${name}!`, "success");

        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid credentials. Access denied.';
            addNotification(msg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center pt-10">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="sleek-panel p-10 bg-white">
                    <div className="text-center mb-8">
                        <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <ShieldCheck className="w-6 h-6 text-slate-900" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 text-sm mt-1">Please enter your credentials to log in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="name@institution.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input-field w-full pl-10 h-11 text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="input-field w-full pl-10 h-11 text-sm transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full h-11 mt-2 text-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-50 pt-6">
                        <p className="text-slate-500 text-xs">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                                Register Institution
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
