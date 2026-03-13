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
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6"
            >
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Ops <span className="text-orange-600">Nexus</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">NIBM Campus Center</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50 shadow-sm">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Live Systems Active
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${styles.statCard} group`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                                <stat.icon size={22} style={{ color: stat.color }} />
                            </div>
                            <div className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">Global</div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{stat.title}</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                                {loading ? '—' : stat.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`${styles.recentOrders}`}
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Active Transmissions</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time order synchronization</p>
                    </div>
                    <Link to="/orders" className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all text-center shadow-lg shadow-slate-900/10">
                        Access Logistics Terminal
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="py-24 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <Package className="mx-auto mb-6 text-slate-200" size={64} strokeWidth={1} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No Active Transmissions</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {recentOrders.map((order) => {
                            const { bg, color } = getStatusColor(order.status);
                            const ts = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                            return (
                                <div key={order.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-orange-200 transition-all gap-5 hover:shadow-xl hover:shadow-slate-100/50">
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors group-hover:scale-105 duration-500">
                                            <Package size={28} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h4 className="font-black text-slate-900 text-xl uppercase tracking-tighter">#{order.id.slice(-6).toUpperCase()}</h4>
                                                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{order.userName}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <Clock size={12} />
                                                    {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                    {Object.keys(order.items || {}).length} Units
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                                                <div className="text-[10px] text-primary font-black uppercase tracking-widest">
                                                    LKR {order.total?.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-full md:w-auto px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white shadow-sm text-center`} style={{ background: bg, color }}>
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
