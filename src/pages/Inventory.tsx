import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Inventory.module.css';

interface MenuItem {
    id: string;
    name: string;
    category: string;
    price: number;
    available: boolean;
    description: string;
    image: string;
    rating: number;
    reviewCount: number;
}

const categories = ['All', 'Breakfast', 'Lunch', 'Drinks', 'Savoury', 'Sweet'];

export default function Inventory() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
            const fetched: MenuItem[] = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as MenuItem));
            setItems(fetched);
            setLoading(false);
        }, () => setLoading(false));
        return () => unsubscribe();
    }, []);

    const toggleAvailability = async (id: string, current: boolean) => {
        try {
            await updateDoc(doc(db, 'menu', id), { available: !current });
        } catch (err) {
            console.error('Failed to update availability:', err);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const availableCount = items.filter(i => i.available).length;
    const unavailableCount = items.filter(i => !i.available).length;

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className={styles.title} style={{ margin: 0 }}>Menu Availability</h1>
                    {!loading && (
                        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
                            <span style={{ color: '#10B981', fontWeight: '600' }}>{availableCount} available</span>
                            {' • '}
                            <span style={{ color: 'hsl(var(--destructive))', fontWeight: '600' }}>{unavailableCount} unavailable</span>
                            {' • '}
                            {items.length} total items
                        </p>
                    )}
                </div>
                <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        fontSize: '0.875rem',
                        width: '220px',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Category Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="btn"
                        style={{
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            padding: '0.5rem 1.25rem',
                            whiteSpace: 'nowrap',
                            border: '1px solid',
                            borderColor: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            background: activeCategory === cat ? 'hsla(25, 95%, 45%, 0.1)' : 'hsl(var(--background))',
                            color: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'hsl(var(--muted-foreground))' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid hsl(var(--border))', borderTop: '2px solid hsl(var(--primary))', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Item</th>
                                <th className={styles.th}>Category</th>
                                <th className={styles.th}>Price</th>
                                <th className={styles.th}>Rating</th>
                                <th className={styles.th} style={{ textAlign: 'center' }}>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                                        No items found.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={styles.tr}
                                        style={{ opacity: item.available ? 1 : 0.55 }}
                                    >
                                        <td className={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    style={{ width: '44px', height: '44px', borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }}
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                                                background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))'
                                            }}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className={styles.td} style={{ fontWeight: '700', color: 'hsl(var(--primary))' }}>
                                            Rs. {item.price}
                                        </td>
                                        <td className={styles.td}>
                                            <span style={{ color: '#F59E0B', fontWeight: '600' }}>★ {item.rating}</span>
                                            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}> ({item.reviewCount})</span>
                                        </td>
                                        <td className={styles.td} style={{ textAlign: 'center' }}>
                                            <label className={styles.toggle}>
                                                <input
                                                    type="checkbox"
                                                    checked={item.available}
                                                    onChange={() => toggleAvailability(item.id, item.available)}
                                                />
                                                <span className={styles.slider}></span>
                                            </label>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
