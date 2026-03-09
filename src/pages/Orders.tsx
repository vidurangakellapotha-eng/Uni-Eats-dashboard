import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, PackageCheck, CookingPot, Trash2, Wifi, WifiOff } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Orders.module.css';

interface Order {
    id: string;
    items: { name: string; quantity: number }[];
    status: 'pending' | 'preparing' | 'ready' | 'picked_up' | 'cancelled';
    timestamp: any;
    total: number;
    userId?: string;
    userEmail?: string;
}

export default function Orders() {
    const [activeTab, setActiveTab] = useState('Active');
    const [activeFilter, setActiveFilter] = useState('All Orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Try common Firestore collection names used in Uni Eats apps
        const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                setConnected(true);
                const fetchedOrders: Order[] = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                } as Order));
                setOrders(fetchedOrders);
                setLoading(false);
            },
            (error) => {
                console.error('Firestore error:', error);
                setConnected(false);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const updateStatus = async (id: string, newStatus: Order['status']) => {
        try {
            await updateDoc(doc(db, 'orders', id), { status: newStatus });
        } catch (err) {
            console.error('Failed to update order status:', err);
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            await updateDoc(doc(db, 'orders', id), { status: 'cancelled' });
        } catch (err) {
            console.error('Failed to cancel order:', err);
        }
    };

    const removeFromView = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'orders', id));
        } catch (err) {
            console.error('Failed to remove order:', err);
        }
    };

    const getStatusClass = (status: Order['status']) => {
        switch (status) {
            case 'pending': return styles.statusPending;
            case 'preparing': return styles.statusPreparing;
            case 'ready': return styles.statusReady;
            case 'picked_up': return styles.statusPickedUp;
            case 'cancelled': return styles.statusPending;
            default: return '';
        }
    };

    const getTimestamp = (ts: any): Date => {
        if (!ts) return new Date();
        if (ts.toDate) return ts.toDate(); // Firestore Timestamp
        if (ts.seconds) return new Date(ts.seconds * 1000);
        return new Date(ts);
    };

    const filteredOrders = orders.filter(o => {
        if (activeTab === 'History') return o.status === 'picked_up' || o.status === 'cancelled';
        if (activeTab === 'Active') {
            if (o.status === 'picked_up' || o.status === 'cancelled') return false;
            if (activeFilter === 'All Orders') return true;
            return o.status === activeFilter.toLowerCase();
        }
        return true;
    });

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h1 className={styles.title} style={{ margin: 0 }}>Order Management</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: connected ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                        {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {connected ? 'Live' : 'Disconnected'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--secondary))', padding: '0.25rem', borderRadius: '0.75rem' }}>
                    {['Active', 'History'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setActiveFilter('All Orders'); }}
                            style={{
                                border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: activeTab === tab ? 'hsl(var(--background))' : 'transparent',
                                color: activeTab === tab ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >{tab}</button>
                    ))}
                </div>
            </div>

            {activeTab === 'Active' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {['All Orders', 'Pending', 'Preparing', 'Ready'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className="btn"
                            style={{
                                borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600',
                                padding: '0.5rem 1.5rem', transition: 'all 0.3s ease', border: '1px solid',
                                borderColor: activeFilter === filter ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                background: activeFilter === filter ? 'hsla(25, 95%, 45%, 0.1)' : 'hsl(var(--background))',
                                color: activeFilter === filter ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                            }}
                        >{filter}</button>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '1rem', color: 'hsl(var(--muted-foreground))' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid hsl(var(--border))', borderTop: '2px solid hsl(var(--primary))', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    Loading live orders...
                </div>
            ) : (
                <div className={styles.orderGrid}>
                    <AnimatePresence mode='popLayout'>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <motion.div
                                    layout
                                    key={order.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={styles.orderCard}
                                    style={{ minHeight: '280px', display: 'flex', flexDirection: 'column' }}
                                >
                                    <div className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                                        {order.status.replace('_', ' ').toUpperCase()}
                                    </div>

                                    <div className={styles.orderHeader}>
                                        <div className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
                                            <Clock size={12} />
                                            {getTimestamp(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <span>•</span>
                                            <span style={{ fontWeight: '600', color: 'hsl(var(--primary))' }}>
                                                Rs. {order.total?.toLocaleString() ?? '—'}
                                            </span>
                                        </div>
                                        {order.userEmail && (
                                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
                                                {order.userEmail}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.itemsList} style={{ flex: 1 }}>
                                        {(order.items || []).map((item, idx) => (
                                            <div key={idx} className={styles.item} style={{ padding: '0.5rem 0', borderBottom: '1px solid hsl(var(--border))' }}>
                                                <span style={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}>{item.quantity}x {item.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.actions} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                        {order.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'preparing')} className="btn btn-primary" style={{ flex: 1, gap: '0.5rem' }}>
                                                    <CookingPot size={18} /> Start Preparing
                                                </button>
                                                <button onClick={() => deleteOrder(order.id)} className="btn btn-secondary" style={{ padding: '0.75rem', color: 'hsl(var(--destructive))' }} title="Cancel Order">
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'preparing' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'ready')} className="btn btn-primary" style={{ flex: 1, gap: '0.5rem', background: '#10B981' }}>
                                                    <CheckCircle size={18} /> Mark Ready
                                                </button>
                                                <button onClick={() => deleteOrder(order.id)} className="btn btn-secondary" style={{ padding: '0.75rem', color: 'hsl(var(--destructive))' }} title="Cancel Order">
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'ready' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'picked_up')} className="btn btn-primary" style={{ flex: 1, gap: '0.5rem' }}>
                                                    <PackageCheck size={18} /> Complete Process
                                                </button>
                                                <button onClick={() => deleteOrder(order.id)} className="btn btn-secondary" style={{ padding: '0.75rem', color: 'hsl(var(--destructive))' }} title="Cancel Order">
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                        {(order.status === 'picked_up' || order.status === 'cancelled') && (
                                            <button onClick={() => removeFromView(order.id)} className="btn btn-secondary" style={{ flex: 1, gap: '0.5rem' }}>
                                                <Trash2 size={18} /> Remove
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'hsl(var(--muted-foreground))' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <PackageCheck size={48} strokeWidth={1} style={{ opacity: 0.5 }} />
                                </div>
                                <p>No {activeTab.toLowerCase()} orders matching this filter.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
