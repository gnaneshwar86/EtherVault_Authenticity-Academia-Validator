import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck, Github, Cpu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col bg-bg-light">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2.5 group">
                        <div className="bg-brand-primary p-1.5 rounded-lg group-hover:bg-slate-800 transition-colors shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            EtherVault
                        </span>
                    </Link>

                    <nav className="flex items-center space-x-1">
                        <div className="hidden md:flex items-center text-sm font-medium">
                            <Link to="/" className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === '/' ? 'text-brand-primary bg-slate-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Overview</Link>
                            <Link to="/verify" className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === '/verify' ? 'text-brand-primary bg-slate-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Verification</Link>
                            {isAuthenticated && user?.role === 'INSTITUTION' && (
                                <Link to="/institution" className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === '/institution' ? 'text-brand-primary bg-slate-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Dashboard</Link>
                            )}
                            {isAuthenticated && user?.role === 'ADMIN' && (
                                <Link to="/admin" className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === '/admin' ? 'text-brand-primary bg-slate-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Admin</Link>
                            )}
                        </div>

                        <div className="h-6 w-[1px] bg-slate-200 mx-4 hidden md:block" />

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4 pl-2">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name || 'User'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user.role}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="btn-primary text-sm py-2"
                            >
                                Login
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className="bg-slate-50 border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center space-x-2 text-slate-400">
                        <Cpu className="w-4 h-4" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Distributed Infrastructure v4.2</span>
                    </div>
                    
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} EtherVault. Built for security and scalability.
                    </p>

                    <div className="flex items-center space-x-3">
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm">
                            <Github className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
