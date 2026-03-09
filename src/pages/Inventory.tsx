import { useState } from 'react';
import styles from './Inventory.module.css';

interface Item {
    id: string;
    name: string;
    category: 'Breakfast' | 'Lunch' | 'Savoury' | 'Sweet' | 'Drinks';
    price: number;
    available: boolean;
    stock?: number;
}

const INITIAL_ITEMS: Item[] = [
    // BREAKFAST
    { id: 'b1', name: 'Rice and Curry (Breakfast)', category: 'Breakfast', price: 450, available: true, stock: 20 },
    { id: 'b2', name: 'Egg Hoppers', category: 'Breakfast', price: 150, available: true, stock: 50 },
    { id: 'b3', name: 'String Hoppers', category: 'Breakfast', price: 200, available: true, stock: 30 },

    // LUNCH
    { id: 'l1', name: 'Spicy Noodles', category: 'Lunch', price: 550, available: true, stock: 25 },
    { id: 'l2', name: 'Chicken Fried Rice', category: 'Lunch', price: 650, available: true, stock: 40 },
    { id: 'l3', name: 'Yellow Rice Platter', category: 'Lunch', price: 750, available: true, stock: 15 },
    { id: 'l4', name: 'Rice & Curry (Lunch)', category: 'Lunch', price: 550, available: true, stock: 60 },

    // SAVOURY
    { id: 's1', name: 'Chinese Rolls', category: 'Savoury', price: 120, available: true, stock: 100 },
    { id: 's2', name: 'Fish Bun', category: 'Savoury', price: 100, available: true, stock: 80 },
    { id: 's3', name: 'Classic Hotdog', category: 'Savoury', price: 250, available: true, stock: 30 },

    // SWEET
    { id: 'sw1', name: 'Choco Chip Muffin', category: 'Sweet', price: 180, available: true, stock: 20 },
    { id: 'sw2', name: 'Velvet Cupcakes', category: 'Sweet', price: 150, available: true, stock: 24 },

    // DRINKS
    { id: 'd1', name: 'Coca-Cola', category: 'Drinks', price: 150, available: true, stock: 200 },
    { id: 'd2', name: 'Milky Drink', category: 'Drinks', price: 250, available: true, stock: 15 },
    { id: 'd3', name: 'Hot Chocolate', category: 'Drinks', price: 300, available: true, stock: 20 },
];

export default function Inventory() {
    const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const categories = ['All', 'Breakfast', 'Lunch', 'Savoury', 'Sweet', 'Drinks'];

    const toggleAvailability = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, available: !item.available } : item
        ));
    };

    const filteredItems = activeCategory === 'All'
        ? items
        : items.filter(item => item.category === activeCategory);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Menu & Inventory Management</h1>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="btn"
                        style={{
                            background: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                            color: activeCategory === cat ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '9999px',
                            padding: '0.5rem 1.25rem',
                            fontSize: '0.875rem'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table} style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => (
                            <tr key={item.id} style={{ opacity: item.available ? 1 : 0.6 }}>
                                <td style={{ fontWeight: '500' }}>{item.name}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        background: 'hsl(var(--secondary))',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        color: 'hsl(var(--muted-foreground))'
                                    }}>
                                        {item.category}
                                    </span>
                                </td>
                                <td>Rs. {item.price}</td>
                                <td>{item.stock !== undefined ? item.stock : '-'}</td>
                                <td>
                                    <span style={{
                                        color: item.available ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)',
                                        fontWeight: '600',
                                        fontSize: '0.875rem'
                                    }}>
                                        {item.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </td>
                                <td>
                                    <label className={styles.toggleSwitch}>
                                        <input
                                            type="checkbox"
                                            checked={item.available}
                                            onChange={() => toggleAvailability(item.id)}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
