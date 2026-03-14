import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import styles from './Analytics.module.css';
import { ArrowUpRight, TrendingUp, DollarSign, Activity, Wallet, CreditCard, Banknote } from 'lucide-react';
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

    // Filter logic based on timeFilter
    const now = new Date();
    const currentMillis = now.getTime();
    
    let timeThreshold = 0;
    if (timeFilter === 'Day') {
        timeThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (timeFilter === 'Week') {
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        timeThreshold = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate()).getTime();
    } else if (timeFilter === 'Month') {
        timeThreshold = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }

    const filteredOrders = orders.filter((o: Order) => {
        if (timeFilter === 'All') return true;
        const orderTime = o.createdAt?.toMillis ? o.createdAt.toMillis() : (o.createdAt?.seconds ? o.createdAt.seconds * 1000 : 0);
        return orderTime >= timeThreshold && orderTime <= currentMillis;
    });

    // Aggregations based on filtered orders
    const completedOrders = filteredOrders.filter((o: Order) => o.status === 'COMPLETED');
    const totalRevenue = completedOrders.reduce((sum: number, o: Order) => sum + (o.total || 0), 0);
    const totalOrdersCount = filteredOrders.length;
    const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    // Payment method breakdown
    const cashRev = completedOrders.filter((o: Order) => o.paymentMethod === 'Cash at Counter').reduce((sum: number, o: Order) => sum + (o.total || 0), 0);
    const cardRev = completedOrders.filter((o: Order) => o.paymentMethod === 'Credit/Debit Card').reduce((sum: number, o: Order) => sum + (o.total || 0), 0);
    const creditRev = completedOrders.filter((o: Order) => o.paymentMethod === 'Campus Credits').reduce((sum: number, o: Order) => sum + (o.total || 0), 0);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 px-1">
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Revenue <span className="text-emerald-600">Nexus</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Integrated Financial Surveillance System</p>
                </div>

                <div className="flex bg-slate-100/80 dark:bg-zinc-900/50 p-1 rounded-2xl border border-slate-200/50">
                    {['Day', 'Week', 'Month', 'All'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            className={`px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${
                                timeFilter === filter 
                                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className={`${styles.card} xl:col-span-2`}>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Revenue Streams</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <Banknote size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Cash</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 leading-none">Rs. {cashRev.toLocaleString()}</div>
                        </div>
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-blue-600">
                                <CreditCard size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Card</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 leading-none">Rs. {cardRev.toLocaleString()}</div>
                        </div>
                        <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-amber-600">
                                <Wallet size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Credits</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 leading-none">Rs. {creditRev.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                <div className={styles.card}>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Distribution Matrix</h2>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {paymentMethodData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `Rs. ${(value || 0).toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
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
