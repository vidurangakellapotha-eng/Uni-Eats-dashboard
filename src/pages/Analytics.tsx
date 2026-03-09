import { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import styles from './Analytics.module.css';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Activity, Calendar } from 'lucide-react';

const weeklyData = [
    { name: 'Mon', revenue: 4000, orders: 45 },
    { name: 'Tue', revenue: 3000, orders: 35 },
    { name: 'Wed', revenue: 5000, orders: 60 },
    { name: 'Thu', revenue: 2780, orders: 30 },
    { name: 'Fri', revenue: 6890, orders: 85 },
    { name: 'Sat', revenue: 8390, orders: 110 },
    { name: 'Sun', revenue: 10490, orders: 125 },
];

const dailyData = [
    { name: '08:00', revenue: 800, orders: 10 },
    { name: '10:00', revenue: 1200, orders: 15 },
    { name: '12:00', revenue: 4500, orders: 40 },
    { name: '14:00', revenue: 3200, orders: 28 },
    { name: '16:00', revenue: 1500, orders: 12 },
    { name: '18:00', revenue: 2200, orders: 18 },
    { name: '20:00', revenue: 900, orders: 8 },
];

const monthlyData = [
    { name: 'Week 1', revenue: 28000, orders: 320 },
    { name: 'Week 2', revenue: 32000, orders: 380 },
    { name: 'Week 3', revenue: 25000, orders: 290 },
    { name: 'Week 4', revenue: 41000, orders: 450 },
];

const categoryData = [
    { name: 'Breakfast', value: 400 },
    { name: 'Lunch', value: 900 },
    { name: 'Drinks', value: 300 },
    { name: 'Savoury', value: 200 },
    { name: 'Sweet', value: 150 },
];

const COLORS = ['#542A15', '#8B4513', '#D2691E', '#CD853F', '#DEB887'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'hsl(var(--popover))', padding: '10px', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}>
                <p style={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}>{label}</p>
                <p style={{ color: 'hsl(var(--primary))' }}>{`Revenue: Rs. ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const peakHoursData = [
    { hour: '08:00', orders: 20 },
    { hour: '10:00', orders: 35 },
    { hour: '12:00', orders: 120 },
    { hour: '14:00', orders: 85 },
    { hour: '16:00', orders: 40 },
    { hour: '18:00', orders: 65 },
    { hour: '20:00', orders: 30 },
];

export default function Analytics() {
    const [timeFilter, setTimeFilter] = useState('Week');

    const getChartData = () => {
        switch (timeFilter) {
            case 'Day': return dailyData;
            case 'Month': return monthlyData;
            default: return weeklyData;
        }
    };

    const getStats = () => {
        switch (timeFilter) {
            case 'Day': return { revenue: '4,560', orders: '52', aov: '480', revTrend: '+5.2%', orderTrend: '+2.1%', aovTrend: '-1.5%' };
            case 'Month': return { revenue: '126,450', orders: '1,440', aov: '585', revTrend: '+15.8%', orderTrend: '+10.2%', aovTrend: '+3.5%' };
            default: return { revenue: '24,560', orders: '435', aov: '564', revTrend: '+12.5%', orderTrend: '+8.2%', aovTrend: '-2.1%' };
        }
    };

    const stats = getStats();

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className={styles.title} style={{ margin: 0 }}>Analytics & Reporting</h1>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--secondary))', padding: '0.25rem', borderRadius: '0.75rem' }}>
                    {['Day', 'Week', 'Month'].map(filter => (
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

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.statLabel}>Total Revenue</span>
                        <DollarSign size={20} style={{ color: '#10B981' }} />
                    </div>
                    <span className={styles.statValue}>Rs. {stats.revenue}</span>
                    <span className={`${styles.statTrend} ${stats.revTrend.startsWith('+') ? styles.positive : styles.negative}`}>
                        {stats.revTrend.startsWith('+') ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {stats.revTrend} from last {timeFilter.toLowerCase()}
                    </span>
                </div>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.statLabel}>Total Orders</span>
                        <Activity size={20} style={{ color: '#3B82F6' }} />
                    </div>
                    <span className={styles.statValue}>{stats.orders}</span>
                    <span className={`${styles.statTrend} ${stats.orderTrend.startsWith('+') ? styles.positive : styles.negative}`}>
                        {stats.orderTrend.startsWith('+') ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {stats.orderTrend} from last {timeFilter.toLowerCase()}
                    </span>
                </div>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.statLabel}>Avg. Order Value</span>
                        <TrendingUp size={20} style={{ color: 'hsl(25, 95%, 45%)' }} />
                    </div>
                    <span className={styles.statValue}>Rs. {stats.aov}</span>
                    <span className={`${styles.statTrend} ${stats.aovTrend.startsWith('+') ? styles.positive : styles.negative}`}>
                        {stats.aovTrend.startsWith('+') ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {stats.aovTrend} from last {timeFilter.toLowerCase()}
                    </span>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Revenue Chart */}
                <div className={styles.card} style={{ height: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}>Sales Overview</h2>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                            {timeFilter}ly Performance
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={getChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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

                {/* Category Chart */}
                <div className={styles.card} style={{ height: '400px' }}>
                    <h2 className={styles.cardTitle}>Sales by Category</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} formatter={(val) => <span style={{ color: 'hsl(var(--foreground))' }}>{val}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Selling Analysis Part */}
            <div className={styles.grid} style={{ marginTop: '2rem' }}>
                {/* Peak Hours Chart */}
                <div className={styles.card} style={{ height: '400px' }}>
                    <h2 className={styles.cardTitle}>Peak Selling Hours</h2>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
                        Identifying busiest times to optimize staff preparation.
                    </p>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={peakHoursData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                itemStyle={{ color: 'hsl(var(--primary))' }}
                            />
                            <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Efficiency Stats */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Preparation Efficiency</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                            { label: 'Avg. Preparation Time', value: '8.4 mins', trend: '-1.2 mins', color: '#10B981' },
                            { label: 'Order Completion Rate', value: '98.2%', trend: '+0.5%', color: '#10B981' },
                            { label: 'Customer Wait Time', value: '12.1 mins', trend: '+1.5 mins', color: '#EF4444' },
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

            {/* Top Selling Items */}
            <div className={styles.card} style={{ marginTop: '2rem' }}>
                <h2 className={styles.cardTitle}>Selling Item Analysis</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { name: 'Chicken Fried Rice', sales: 124, revenue: 80600, margin: '24%' },
                        { name: 'Fish Bun', sales: 98, revenue: 9800, margin: '68%' },
                        { name: 'Coca-Cola', sales: 85, revenue: 12750, margin: '45%' },
                        { name: 'Spicy Noodles', sales: 65, revenue: 35750, margin: '32%' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            background: 'hsl(var(--secondary))',
                            borderRadius: '0.5rem'
                        }}>
                            <div>
                                <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>{item.name}</div>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>{item.sales} Units Sold • <span style={{ color: 'hsl(var(--primary))' }}>{item.margin} Margin</span></div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: 'hsl(var(--foreground))', textAlign: 'right' }}>
                                Rs. {item.revenue.toLocaleString()}
                                <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'hsl(var(--muted-foreground))' }}>Total Revenue</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
