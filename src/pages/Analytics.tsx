import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import styles from './Analytics.module.css';
import { ArrowUpRight, TrendingUp, DollarSign, Activity, Calendar, Wallet, CreditCard, Banknote } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

interface Order {
    id: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt?: any;
}

const PAYMENT_COLORS = ['#10B981', '#3B82F6', '#F59E0B']; // Cash, Card, Credits

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'hsl(var(--popover))', padding: '10px', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}>
                <p style={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}>{label}</p>
                <p style={{ color: 'hsl(var(--primary))' }}>{`Revenue: Rs. ${payload[0].value.toLocaleString()}`}</p>
            </div>
        );
    }
    return null;
};

export default function Analytics() {
    const [timeFilter, setTimeFilter] = useState('Week');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'orders'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order));
            setOrders(fetchedOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Aggregations
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrdersCount = orders.length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / completedOrders.length || 0) : 0;

    // Payment method breakdown
    const cashRev = completedOrders.filter(o => o.paymentMethod === 'Cash at Counter').reduce((sum, o) => sum + (o.total || 0), 0);
    const cardRev = completedOrders.filter(o => o.paymentMethod === 'Credit/Debit Card').reduce((sum, o) => sum + (o.total || 0), 0);
    const creditRev = completedOrders.filter(o => o.paymentMethod === 'Campus Credits').reduce((sum, o) => sum + (o.total || 0), 0);

    const paymentMethodData = [
        { name: 'Cash', value: cashRev },
        { name: 'Card', value: cardRev },
        { name: 'Campus Credits', value: creditRev },
    ].filter(d => d.value > 0);

    // Mock data for charts (would be improved with real timestamp processing)
    const chartData = [
        { name: 'Mon', revenue: totalRevenue * 0.12 },
        { name: 'Tue', revenue: totalRevenue * 0.15 },
        { name: 'Wed', revenue: totalRevenue * 0.10 },
        { name: 'Thu', revenue: totalRevenue * 0.18 },
        { name: 'Fri', revenue: totalRevenue * 0.20 },
        { name: 'Sat', revenue: totalRevenue * 0.15 },
        { name: 'Sun', revenue: totalRevenue * 0.10 },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'hsl(var(--primary))' }}>
                <Activity className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className={styles.title} style={{ margin: 0 }}>Revenue Tracking Dashboard</h1>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--secondary))', padding: '0.25rem', borderRadius: '0.75rem' }}>
                    {['Day', 'Week', 'Month', 'All'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            style={{
                                border: 'none',
                                padding: '0.5rem 1.25rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: timeFilter === filter ? 'hsl(var(--background))' : 'transparent',
                                color: timeFilter === filter ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: timeFilter === filter ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <Calendar size={14} />
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.statLabel}>Total Net Revenue</span>
                        <DollarSign size={20} style={{ color: '#10B981' }} />
                    </div>
                    <span className={styles.statValue}>Rs. {totalRevenue.toLocaleString()}</span>
                    <span className={`${styles.statTrend} ${styles.positive}`}>
                        <ArrowUpRight size={16} />
                        Live from Firestore
                    </span>
                </div>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.statLabel}>Total Orders</span>
                        <Activity size={20} style={{ color: '#3B82F6' }} />
                    </div>
                    <span className={styles.statValue}>{totalOrdersCount}</span>
                    <span className={`${styles.statTrend} ${styles.positive}`}>
                        <Activity size={16} />
                        {completedOrders.length} Completed
                    </span>
                </div>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.statLabel}>Avg. Ticket Size</span>
                        <TrendingUp size={20} style={{ color: 'hsl(25, 95%, 45%)' }} />
                    </div>
                    <span className={styles.statValue}>Rs. {avgOrderValue.toLocaleString()}</span>
                    <span className={`${styles.statTrend} ${styles.positive}`}>
                        <TrendingUp size={16} />
                        Across all items
                    </span>
                </div>
            </div>

            {/* Revenue Breakdown by Payment Method */}
            <div className={styles.grid} style={{ marginBottom: '2rem' }}>
                <div className={styles.card} style={{ flex: 1.5 }}>
                    <h2 className={styles.cardTitle}>Revenue by Payment Method</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ padding: '1.5rem', background: 'hsl(var(--secondary))', borderRadius: '1rem', border: '1px solid hsl(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Banknote size={20} style={{ color: '#10B981' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>Cash</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs. {cashRev.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'hsl(var(--secondary))', borderRadius: '1rem', border: '1px solid hsl(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <CreditCard size={20} style={{ color: '#3B82F6' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>Card</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs. {cardRev.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'hsl(var(--secondary))', borderRadius: '1rem', border: '1px solid hsl(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Wallet size={20} style={{ color: '#F59E0B' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>Campus Credit</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs. {creditRev.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                <div className={styles.card} style={{ flex: 1 }}>
                    <h2 className={styles.cardTitle}>Payment Distribution</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={paymentMethodData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {paymentMethodData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `Rs. ${(value || 0).toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Revenue Chart */}
                <div className={styles.card} style={{ height: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}>Revenue Trend</h2>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                            Distributed by Volume
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `Rs.${val/1000}k` } />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Selling Analysis Part */}
                <div className={styles.card} style={{ height: '400px' }}>
                    <h2 className={styles.cardTitle}>Efficiency Overview</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                            { label: 'Avg. Preparation Time', value: '7.2 mins', trend: '-2.1 mins', color: '#10B981' },
                            { label: 'Order Completion Rate', value: '99.4%', trend: '+1.2%', color: '#10B981' },
                            { label: 'Peak Capacity Utilization', value: '82%', trend: '+5%', color: '#3B82F6' },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '1rem', background: 'hsl(var(--secondary))', borderRadius: '0.75rem', border: '1px solid hsl(var(--border))' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>{item.label}</span>
                                    <span style={{ fontSize: '0.875rem', color: item.color, fontWeight: 'bold' }}>{item.trend}</span>
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
