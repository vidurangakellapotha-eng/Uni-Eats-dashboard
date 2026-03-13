import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, PackageCheck, CookingPot, Trash2, Wifi, WifiOff, User } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { pushNotification } from '../notificationUtils';
import styles from './Orders.module.css';

// Matches exactly how Uni Eats app stores orders in Firestore
interface OrderItem {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    userId: string;
    userName: string;
    userType: string;
    items: OrderItem[];
    total: number;
    status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'REJECTED';
    paymentMethod: string;
    timestamp: string;
    createdAt: any; // Firestore serverTimestamp
}

export default function Orders() {
    const [activeTab, setActiveTab] = useState('Active');
    const [activeFilter, setActiveFilter] = useState('All Orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Uses 'createdAt' — matches Uni Eats app's addDoc field
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

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

    // Update order status and notify student
    const updateStatus = async (id: string, newStatus: Order['status']) => {
        try {
            const orderObj = orders.find(o => o.id === id);
            await updateDoc(doc(db, 'orders', id), { status: newStatus });

            if (orderObj) {
                const shortId = id.slice(-6).toUpperCase();
                let title = '';
                let message = '';
                let type = 'order';

                if (newStatus === 'PREPARING') {
                    title = '👨‍🍳 Being Prepared!';
                    message = `Your order #${shortId} is now being prepared by the kitchen and will be ready soon.`;
                    type = 'order';
                    await pushNotification(orderObj.userId, title, message, type, id, 'restaurant', '#F59E0B');
                } else if (newStatus === 'READY') {
                    title = '🛍 Ready for Pickup!';
                    message = `Order #${shortId} is hot and ready. Head to the counter to collect your meal!`;
                    type = 'ready';
                    await pushNotification(orderObj.userId, title, message, type, id, 'shopping_bag', '#10B981');
                } else if (newStatus === 'COMPLETED') {
                    title = '✅ Order Picked Up';
                    message = `Enjoy your meal! Order #${shortId} has been successfully completed.`;
                    type = 'completed';
                    await pushNotification(orderObj.userId, title, message, type, id, 'check_circle', '#6366F1');
                }
            }
        } catch (err) {
            console.error('Failed to update order status:', err);
        }
    };

    const rejectOrder = async (id: string) => {
        try {
            const orderObj = orders.find(o => o.id === id);
            await updateDoc(doc(db, 'orders', id), { status: 'REJECTED' });

            if (orderObj) {
                const shortId = id.slice(-6).toUpperCase();
                await pushNotification(
                    orderObj.userId, 
                    '❌ Order Rejected', 
                    `We're sorry! Order #${shortId} has been rejected. Please check with the counter or try again.`, 
                    'alert', 
                    id,
                    'cancel',
                    '#EF4444'
                );
            }
        } catch (err) {
            console.error('Failed to reject order:', err);
        }
    };

    const removeOrder = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'orders', id));
        } catch (err) {
            console.error('Failed to remove order:', err);
        }
    };

    const getStatusClass = (status: Order['status']) => {
        switch (status) {
            case 'PLACED': return styles.statusPending;
            case 'PREPARING': return styles.statusPreparing;
            case 'READY': return styles.statusReady;
            case 'COMPLETED': return styles.statusPickedUp;
            case 'REJECTED': return styles.statusRejected;
            default: return '';
        }
    };

    const getStatusLabel = (status: Order['status']) => {
        switch (status) {
            case 'PLACED': return 'NEW ORDER';
            case 'PREPARING': return 'PREPARING';
            case 'READY': return 'READY';
            case 'COMPLETED': return 'COMPLETED';
            case 'REJECTED': return 'CANCELLED';
            default: return status;
        }
    };

    const getTimestamp = (order: Order): string => {
        if (order.createdAt?.toDate) {
            return order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return order.timestamp || '—';
    };

    const filteredOrders = orders.filter(o => {
        if (activeTab === 'History') return o.status === 'COMPLETED' || o.status === 'REJECTED';
        if (activeTab === 'Active') {
            if (o.status === 'COMPLETED' || o.status === 'REJECTED') return false;
            if (activeFilter === 'All Orders') return true;
            if (activeFilter === 'Pending') return o.status === 'PLACED';
            if (activeFilter === 'Preparing') return o.status === 'PREPARING';
            if (activeFilter === 'Ready') return o.status === 'READY';
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
                                        {getStatusLabel(order.status)}
                                    </div>

                                    <div className={styles.orderHeader}>
                                        <div className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
                                            <Clock size={12} />
                                            {getTimestamp(order)}
                                            <span>•</span>
                                            <span style={{ fontWeight: '600', color: 'hsl(var(--primary))' }}>
                                                LKR {order.total?.toLocaleString() ?? '—'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
                                            <User size={11} />
                                            {order.userName || 'Unknown'} • {order.paymentMethod || '—'}
                                        </div>
                                    </div>

                                    <div className={styles.itemsList} style={{ flex: 1 }}>
                                        {(order.items || []).map((item, idx) => (
                                            <div key={idx} className={styles.item} style={{ padding: '0.5rem 0', borderBottom: '1px solid hsl(var(--border))' }}>
                                                <span style={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}>
                                                    {item.quantity}x {item.name}
                                                </span>
                                                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>
                                                    LKR {(item.price * item.quantity).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={styles.actions} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                        {order.status === 'PLACED' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'PREPARING')} className="btn btn-primary" style={{ flex: 1, gap: '0.5rem' }}>
                                                    <CookingPot size={18} /> Start Preparing
                                                </button>
                                                <button onClick={() => rejectOrder(order.id)} className="btn btn-secondary" style={{ padding: '0.75rem', color: 'hsl(var(--destructive))' }} title="Reject Order">
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'READY')} className="btn btn-primary" style={{ flex: 1, gap: '0.5rem', background: '#10B981' }}>
                                                    <CheckCircle size={18} /> Mark Ready
                                                </button>
                                                <button onClick={() => rejectOrder(order.id)} className="btn btn-secondary" style={{ padding: '0.75rem', color: 'hsl(var(--destructive))' }} title="Cancel Order">
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'READY' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="btn btn-primary" style={{ flex: 1, gap: '0.5rem' }}>
                                                    <PackageCheck size={18} /> Complete Order
                                                </button>
                                                <button onClick={() => rejectOrder(order.id)} className="btn btn-secondary" style={{ padding: '0.75rem', color: 'hsl(var(--destructive))' }} title="Cancel Order">
                                                    <XCircle size={20} />
                                                </button>
                                            </>
                                        )}
                                        {(order.status === 'COMPLETED' || order.status === 'REJECTED') && (
                                            <button onClick={() => removeOrder(order.id)} className="btn btn-secondary" style={{ flex: 1, gap: '0.5rem' }}>
                                                <Trash2 size={18} /> Remove
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 2rem', color: 'hsl(var(--muted-foreground))' }}>
                                <PackageCheck size={48} strokeWidth={1} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                                {orders.length === 0 ? (
                                    <>
                                        <p style={{ fontWeight: '600', color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
                                            Waiting for orders from Uni Eats app...
                                        </p>
                                        <p style={{ fontSize: '0.8rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                                            When a student places an order in the Uni Eats app, it will appear here instantly with live updates.
                                        </p>
                                    </>
                                ) : (
                                    <p>No {activeTab.toLowerCase()} orders matching this filter.</p>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
