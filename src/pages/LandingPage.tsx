import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, BarChart3, Clock, Zap, ShieldCheck, ArrowRight, Layers, MousePointer2 } from 'lucide-react';
import Typewriter from '../components/Typewriter';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-hidden relative selection:bg-orange-100 selection:text-orange-900">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] -ml-64 -mb-64" />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center backdrop-blur-md border-b border-slate-100/50">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                        <ChefHat size={24} />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">Uni Eats <span className="text-orange-600">Ops</span></span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <a href="#" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Features</a>
                    <a href="#" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Infrastructure</a>
                    <a href="#" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Security</a>
                    <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        Admin Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-8 flex flex-col items-center justify-center max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-black uppercase tracking-widest">
                        <Zap size={14} className="fill-orange-600" />
                        <span>Corporate Enterprise Portal 2.0</span>
                    </div>

                    <div className="text-6xl sm:text-8xl font-black tracking-tighter leading-[1.05] text-slate-900 max-w-4xl">
                        <Typewriter
                            segments={[
                                { text: "Operate " },
                                { text: "Faster. ", className: "text-orange-600" },
                                { text: "Scale " },
                                { text: "Smarter.", className: "text-orange-600" }
                            ]}
                        />
                    </div>

                    <p className="text-xl text-slate-500 max-w-2xl font-medium leading-relaxed">
                        The mission-critical command center for Uni-Eats cafeteria operations. 
                        Optimize workflows, manage inventory, and drive revenue with data-driven precision.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                        <button
                            onClick={() => navigate('/login')}
                            className="group px-10 py-5 rounded-3xl bg-slate-900 text-white font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all w-full sm:w-auto"
                        >
                            Enter Portal 
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-10 py-5 rounded-3xl bg-white text-slate-900 border-2 border-slate-100 font-black text-xl hover:bg-slate-50 active:scale-95 transition-all w-full sm:w-auto">
                            System Health
                        </button>
                    </div>
                </motion.div>

                {/* Dashboard Preview / Abstract Shape */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-24 w-full relative"
                >
                    <div className="absolute inset-0 bg-orange-600/10 blur-[100px] scale-90 -z-10" />
                    <div className="bg-slate-50 rounded-[3rem] p-4 sm:p-8 border border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <div className="ml-4 h-6 px-4 rounded-full bg-slate-200/50 text-[10px] font-black uppercase text-slate-400 flex items-center">
                                unieats-admin-v2.0 / real-time-nexus
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-6 h-[400px]">
                            <div className="col-span-3 space-y-4">
                                <div className="h-10 w-full bg-slate-200 rounded-xl" />
                                <div className="h-10 w-full bg-slate-200/50 rounded-xl" />
                                <div className="h-10 w-full bg-slate-200/50 rounded-xl" />
                                <div className="h-10 w-3/4 bg-slate-200/50 rounded-xl" />
                                <div className="mt-8 space-y-4">
                                    <div className="h-24 w-full bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl" />
                                </div>
                            </div>
                            <div className="col-span-9 grid grid-cols-3 gap-6">
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                                        <BarChart3 size={20} />
                                    </div>
                                    <div className="h-2 w-12 bg-slate-100 rounded-full mb-2" />
                                    <div className="h-6 w-20 bg-slate-900 rounded-lg" />
                                </div>
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                        <Clock size={20} />
                                    </div>
                                    <div className="h-2 w-12 bg-slate-100 rounded-full mb-2" />
                                    <div className="h-6 w-20 bg-slate-900 rounded-lg" />
                                </div>
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="h-2 w-12 bg-slate-100 rounded-full mb-2" />
                                    <div className="h-6 w-20 bg-slate-900 rounded-lg" />
                                </div>
                                <div className="col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex-1">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="h-4 w-32 bg-slate-200 rounded-full" />
                                        <div className="h-4 w-12 bg-slate-100 rounded-full" />
                                    </div>
                                    <div className="flex items-end gap-3 h-32">
                                        <div className="flex-1 bg-orange-100 rounded-t-xl h-[40%]" />
                                        <div className="flex-1 bg-orange-200 rounded-t-xl h-[65%]" />
                                        <div className="flex-1 bg-orange-500 rounded-t-xl h-[90%]" />
                                        <div className="flex-1 bg-orange-300 rounded-t-xl h-[55%]" />
                                        <div className="flex-1 bg-orange-600 rounded-t-xl h-[100%]" />
                                        <div className="flex-1 bg-orange-200 rounded-t-xl h-[75%]" />
                                        <div className="flex-1 bg-orange-400 rounded-t-xl h-[85%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Row */}
            <section className="py-32 px-8 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="space-y-6 group">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                            <Layers size={28} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Unified Nexus</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            A single source of truth for your entire cafeteria. Sync menu changes, stock levels, and order logs in milliseconds.
                        </p>
                    </div>
                    <div className="space-y-6 group">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                            <MousePointer2 size={28} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Actionable Intel</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Go beyond raw data. Visualize peak hours, top-performing cuisines, and student spending habits with ease.
                        </p>
                    </div>
                    <div className="space-y-6 group">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Bank-Grade Security</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Encrypted session management and role-based access control ensure your business operation remains bulletproof.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">&copy; 2026 Uni Eats Enterprise Operations. All Rights Reserved.</p>
            </footer>
        </div>
    );
}

// Simple Helper for the preview
function CheckCircle2({ size, className }: { size?: number, className?: string }) {
    return <Zap size={size} className={className} />
}
