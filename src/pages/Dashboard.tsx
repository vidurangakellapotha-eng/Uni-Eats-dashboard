import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const [counts, setCounts] = useState({ pending: 0, preparing: 0, ready: 0, total: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const pending = all.filter(o => o.status === 'PLACED').length;
            const preparing = all.filter(o => o.status === 'PREPARING').length;
            const ready = all.filter(o => o.status === 'READY').length;
            const total = all.length;
            setCounts({ pending, preparing, ready, total });
            // Recent 3 active orders sorted by timestamp descending
            const recent = all
                .filter(o => o.status !== 'COMPLETED' && o.status !== 'REJECTED')
                .sort((a, b) => {
                    const ta = a.createdAt?.seconds ?? 0;
                    const tb = b.createdAt?.seconds ?? 0;
                    return tb - ta;
                })
                .slice(0, 3);
            setRecentOrders(recent);
            setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
    }, []);

    const stats = [
        { title: 'New Orders', value: counts.pending, icon: Package, color: 'hsl(25, 95%, 45%)' },
        { title: 'In Preparation', value: counts.preparing, icon: Clock, color: 'hsl(45, 93%, 40%)' },
        { title: 'Ready for Pickup', value: counts.ready, icon: CheckCircle, color: 'hsl(142, 71%, 45%)' },
        { title: 'Total Today', value: counts.total, icon: AlertTriangle, color: 'hsl(220, 80%, 60%)' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PLACED': return { bg: 'hsla(45, 93%, 47%, 0.1)', color: 'hsl(45, 93%, 35%)' };
            case 'PREPARING': return { bg: 'hsla(25, 95%, 45%, 0.1)', color: 'hsl(25, 95%, 40%)' };
            case 'READY': return { bg: 'hsla(142, 71%, 45%, 0.1)', color: 'hsl(142, 71%, 38%)' };
            case 'REJECTED': return { bg: 'hsla(0, 84%, 60%, 0.1)', color: 'hsl(0, 84%, 50%)' };
            default: return { bg: 'hsla(0,0%,50%,0.1)', color: 'hsl(0,0%,40%)' };
        }
    };

    return (
        <div className="max-w-full overflow-hidden">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">
                        Ops <span className="text-orange-600">Nexus</span>
                    </h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">NIBM Campus Command Center</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Systems Active
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${styles.statCard} group hover:border-primary/20 transition-all`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                                <stat.icon size={20} style={{ color: stat.color }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.title}</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                            {loading ? '—' : stat.value}
                        </h3>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 md:p-10 border border-slate-100 border-b-4"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Transmissions</h2>
                    <Link to="/orders" className="text-[10px] font-black uppercase text-primary tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2">
                        View All Systems <span className="material-icons-round text-sm">arrow_forward</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="py-20 text-center">
                        <Package className="mx-auto mb-4 text-slate-200" size={48} />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Active Orders Detected</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentOrders.map((order) => {
                            const { bg, color } = getStatusColor(order.status);
                            const ts = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                            return (
                                <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-primary/20 transition-all gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary rotate-3">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter">#{order.id.slice(-6).toUpperCase()}</h4>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">• {order.userName}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">
                                                {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {Object.keys(order.items || {}).length} Items • Rs. {order.total?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white shadow-sm`} style={{ background: bg, color }}>
                                        {order.status.replace('_', ' ')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
