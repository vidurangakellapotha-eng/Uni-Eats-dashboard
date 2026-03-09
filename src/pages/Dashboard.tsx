import { useEffect, useState } from 'react';
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
        <div>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}
            >
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>
                    Dashboard Overview
                </h1>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--secondary))', padding: '0.35rem 0.75rem', borderRadius: '9999px' }}>
                    🔴 Live Data
                </span>
            </motion.div>

            <div className={styles.grid}>
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={styles.statCard}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={styles.statTitle}>{stat.title}</span>
                            <stat.icon size={24} style={{ color: stat.color }} />
                        </div>
                        <span className={styles.statValue}>
                            {loading ? '—' : stat.value}
                        </span>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={styles.recentOrders}
                style={{ marginTop: '2rem' }}
            >
                <h2 className={styles.sectionTitle}>Live Active Orders</h2>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        <div style={{ width: '24px', height: '24px', border: '2px solid hsl(var(--border))', borderTop: '2px solid hsl(var(--primary))', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        No active orders right now.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentOrders.map((order) => {
                            const { bg, color } = getStatusColor(order.status);
                            const ts = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                            return (
                                <div key={order.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem', borderRadius: '0.5rem',
                                    background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                            background: 'hsla(25, 95%, 45%, 0.1)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', color: 'hsl(25, 95%, 45%)'
                                        }}>
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: 'hsl(var(--foreground))' }}>
                                                #{order.id.slice(-6).toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                                                {(order.items || []).length} item(s) • Rs. {order.total?.toLocaleString() ?? '—'} • {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '9999px',
                                        fontSize: '0.75rem', fontWeight: '600', background: bg, color
                                    }}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
