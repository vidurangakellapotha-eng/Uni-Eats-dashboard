import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Pencil, X, Save, Tag, AlignLeft, LayoutGrid, DollarSign, Camera, Upload } from 'lucide-react';
import { uploadFoodImage } from '../storageUtils';
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
    prepTime?: number; // minutes
}

const categories = ['All', 'Breakfast', 'Lunch', 'Drinks', 'Savoury', 'Sweet'];
const editableCategories = ['Breakfast', 'Lunch', 'Drinks', 'Savoury', 'Sweet'];

export default function Inventory() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [editItem, setEditItem] = useState<MenuItem | null>(null);
    const [editForm, setEditForm] = useState({ name: '', price: '', category: '', description: '', prepTime: '' });
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

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

    const openEdit = (item: MenuItem) => {
        setEditItem(item);
        setEditForm({
            name: item.name,
            price: String(item.price),
            category: item.category,
            description: item.description || '',
            prepTime: item.prepTime !== undefined ? String(item.prepTime) : ''
        });
        setSaveSuccess(false);
    };

    const closeEdit = () => {
        setEditItem(null);
        setSaveSuccess(false);
        setSelectedFile(null);
        setImagePreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!editItem) return;
        const priceVal = parseFloat(editForm.price);
        if (isNaN(priceVal) || priceVal < 0) return;

        const prepTimeVal = editForm.prepTime !== '' ? parseInt(editForm.prepTime, 10) : null;
        let imageUrl = editItem.image;
        setSaving(true);
        try {
            // Upload new image if selected
            if (selectedFile) {
                setUploadingImage(true);
                imageUrl = await uploadFoodImage(editItem.id, selectedFile);
                setUploadingImage(false);
            }

            await updateDoc(doc(db, 'menu', editItem.id), {
                name: editForm.name.trim(),
                price: priceVal,
                category: editForm.category,
                description: editForm.description.trim(),
                image: imageUrl,
                ...(prepTimeVal !== null && !isNaN(prepTimeVal) ? { prepTime: prepTimeVal } : {})
            });
            setSaveSuccess(true);
            setTimeout(() => closeEdit(), 1000);
        } catch (err) {
            console.error('Failed to save item:', err);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-1">
                <div className="flex flex-col gap-1">
                    <h1 className={styles.title} style={{ margin: 0 }}>Menu Ecosystem</h1>
                    {!loading && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="text-emerald-500">{availableCount} online</span>
                            {' • '}
                            <span className="text-rose-500">{unavailableCount} offline</span>
                            {' • '}
                            {items.length} Total Units
                        </p>
                    )}
                </div>
                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Scan entries..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <span className="material-icons-round absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm">search</span>
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-4 -mx-1 px-1 hide-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                            activeCategory === cat 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-white dark:bg-zinc-900 text-slate-400 border-slate-100 dark:border-zinc-800 hover:border-primary/20 hover:text-slate-600'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden mb-10">
                    {filteredItems.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white rounded-3xl border border-slate-100 italic">No Matching Units</div>
                    ) : (
                        filteredItems.map(item => (
                            <div key={item.id} className={`bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-slate-100 transition-opacity duration-500 ${!item.available ? 'opacity-60 bg-slate-50' : ''}`}>
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shadow-inner border border-white">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">{item.category}</span>
                                            <div className="flex gap-1 text-amber-400">
                                                <span className="material-icons-round text-xs">star</span>
                                                <span className="text-[10px] font-black">{item.rating}</span>
                                            </div>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter truncate">{item.name}</h4>
                                        <p className="text-primary font-black text-sm">Rs. {item.price}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <label className={styles.toggle}>
                                            <input
                                                type="checkbox"
                                                checked={item.available}
                                                onChange={() => toggleAvailability(item.id, item.available)}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.available ? 'Online' : 'Offline'}</span>
                                    </div>
                                    <button 
                                        onClick={() => openEdit(item)}
                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className={`${styles.tableWrapper} hidden md:block`}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Item</th>
                                <th className={styles.th}>Category</th>
                                <th className={styles.th}>Price</th>
                                <th className={styles.th}>Prep Time</th>
                                <th className={styles.th}>Rating</th>
                                <th className={styles.th} style={{ textAlign: 'center' }}>Available</th>
                                <th className={styles.th} style={{ textAlign: 'center' }}>Edit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
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
                                                    src={item.image} alt={item.name}
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
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className={styles.td} style={{ fontWeight: '700', color: 'hsl(var(--primary))' }}>
                                            Rs. {item.price}
                                        </td>
                                        <td className={styles.td}>
                                            {item.prepTime !== undefined ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                                                    ⏱ {item.prepTime} min
                                                </span>
                                            ) : (
                                                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem' }}>—</span>
                                            )}
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
                                        <td className={styles.td} style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => openEdit(item)}
                                                title="Edit item"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                    padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                                                    border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))',
                                                    color: 'hsl(var(--foreground))', fontSize: '0.8rem', fontWeight: '600',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                </>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editItem && (
                    <>
                        <div style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2rem'
                        }}>
                            {/* Backdrop */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeEdit}
                                style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(12px)'
                                }}
                            />
    
                            {/* Modal */}
                            <motion.div
                                key="modal"
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                style={{
                                    position: 'relative', width: '100%', maxWidth: '500px',
                                    maxHeight: '90vh', overflowY: 'auto',
                                    background: 'hsl(var(--card))',
                                    borderRadius: '1.5rem',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)',
                                    padding: '2.5rem',
                                    border: '1px solid hsl(var(--border))',
                                    zIndex: 1001
                                }}
                            >
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {editItem.image && (
                                        <img src={editItem.image} alt={editItem.name}
                                            style={{ width: '48px', height: '48px', borderRadius: '0.75rem', objectFit: 'cover' }}
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                    <div>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'hsl(var(--foreground))', margin: 0 }}>
                                            Edit Menu Item
                                        </h2>
                                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                                            Changes apply immediately
                                        </p>
                                    </div>
                                </div>
                                <button onClick={closeEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: '0.25rem' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Image Upload Selection */}
                            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                <div style={{ 
                                    width: '100%', 
                                    height: '160px', 
                                    borderRadius: '1rem', 
                                    overflow: 'hidden', 
                                    position: 'relative',
                                    border: '2px dashed hsl(var(--border))',
                                    background: 'hsl(var(--secondary)/0.3)'
                                }}>
                                    <img 
                                        src={imagePreview || editItem.image} 
                                        alt="Preview" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                    <label style={{ 
                                        position: 'absolute', 
                                        inset: 0, 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        background: 'rgba(0,0,0,0.4)', 
                                        cursor: 'pointer',
                                        transition: 'background 0.3s',
                                        color: 'white',
                                        zIndex: 10
                                    }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}>
                                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', marginBottom: '8px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                                            <Camera size={24} />
                                        </div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Photo</span>
                                        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                    </label>
                                    
                                    {uploadingImage && (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '32px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                                <div style={{ width: '16px', height: '16px', border: '2px solid #ddd', borderTop: '2px solid hsl(var(--primary))', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'black' }}>Uploading Image...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {selectedFile && !uploadingImage && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10B981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Upload size={14} /> Ready to update: {selectedFile.name}
                                    </div>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                {/* Name */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Tag size={12} /> Item Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                                            border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))',
                                            color: 'hsl(var(--foreground))', fontSize: '0.95rem', outline: 'none',
                                            transition: 'border-color 0.2s', boxSizing: 'border-box'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
                                        onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <DollarSign size={12} /> Price (Rs.)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))', fontWeight: '700', fontSize: '1rem' }}>Rs.</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.50"
                                            value={editForm.price}
                                            onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                                            style={{
                                                width: '100%', padding: '0.75rem 1rem 0.75rem 3.5rem',
                                                borderRadius: '0.75rem', border: '1.5px solid hsl(var(--border))',
                                                background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
                                                fontSize: '1.1rem', fontWeight: '700', outline: 'none',
                                                boxSizing: 'border-box', transition: 'border-color 0.2s'
                                            }}
                                            onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
                                            onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <LayoutGrid size={12} /> Category
                                    </label>
                                    <select
                                        value={editForm.category}
                                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                                            border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))',
                                            color: 'hsl(var(--foreground))', fontSize: '0.95rem', outline: 'none',
                                            boxSizing: 'border-box', cursor: 'pointer'
                                        }}
                                    >
                                        {editableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Description */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <AlignLeft size={12} /> Description
                                    </label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                        rows={2}
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                                            border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))',
                                            color: 'hsl(var(--foreground))', fontSize: '0.9rem', outline: 'none',
                                            resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
                                        onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                    />
                                </div>

                                {/* Prep Time */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        ⏱ Prep Time (minutes)
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
                                            step="1"
                                            placeholder="e.g. 10"
                                            value={editForm.prepTime}
                                            onChange={e => setEditForm(f => ({ ...f, prepTime: e.target.value }))}
                                            style={{
                                                width: '120px', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                                                border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))',
                                                color: 'hsl(var(--foreground))', fontSize: '1rem', fontWeight: '700',
                                                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                                                textAlign: 'center'
                                            }}
                                            onFocus={e => e.target.style.borderColor = 'hsl(var(--primary))'}
                                            onBlur={e => e.target.style.borderColor = 'hsl(var(--border))'}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {[5, 10, 15, 20, 30].map(mins => (
                                                <button
                                                    key={mins}
                                                    type="button"
                                                    onClick={() => setEditForm(f => ({ ...f, prepTime: String(mins) }))}
                                                    style={{
                                                        padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                                                        border: '1px solid', fontSize: '0.8rem', fontWeight: '600',
                                                        borderColor: editForm.prepTime === String(mins) ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                                        background: editForm.prepTime === String(mins) ? 'hsla(25,95%,45%,0.1)' : 'hsl(var(--background))',
                                                        color: editForm.prepTime === String(mins) ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {mins}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button
                                    onClick={closeEdit}
                                    style={{
                                        flex: 1, padding: '0.875rem', borderRadius: '0.75rem', cursor: 'pointer',
                                        border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))',
                                        color: 'hsl(var(--foreground))', fontWeight: '600', fontSize: '0.95rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSave}
                                    disabled={saving || !editForm.name.trim() || !editForm.price}
                                    style={{
                                        flex: 2, padding: '0.875rem', borderRadius: '0.75rem', cursor: 'pointer',
                                        border: 'none',
                                        background: saveSuccess ? '#10B981' : 'hsl(var(--primary))',
                                        color: 'white', fontWeight: '700', fontSize: '0.95rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        transition: 'background 0.3s', opacity: saving ? 0.8 : 1
                                    }}
                                >
                                    {saveSuccess ? (
                                        <><span>✓</span> Saved!</>
                                    ) : (saving || uploadingImage) ? (
                                        <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> {uploadingImage ? 'Uploading Image...' : 'Saving...'}</>
                                    ) : (
                                        <><Save size={16} /> Save Changes</>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
            </AnimatePresence>
        </div>
    );
}
