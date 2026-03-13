import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Pencil, X, Camera } from 'lucide-react';
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
                        <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 italic">No Matching Units</div>
                    ) : (
                        filteredItems.map(item => (
                            <div key={item.id} className={`bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-slate-100 dark:border-zinc-800 transition-opacity duration-500 ${!item.available ? 'opacity-60 bg-slate-50 dark:bg-zinc-800/50' : ''}`}>
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-zinc-800 overflow-hidden shadow-inner border border-white/20">
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
                                        <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tighter truncate">{item.name}</h4>
                                        <p className="text-primary font-black text-sm">Rs. {item.price}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-zinc-800">
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
                                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
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
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
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
                                                    onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
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
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
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
                    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeEdit}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-[1001]"
                        >
                            <div className="p-6 sm:p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold dark:text-white">Edit Item</h2>
                                    <button onClick={closeEdit} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative group aspect-video rounded-2xl bg-slate-100 dark:bg-zinc-800 overflow-hidden border-2 border-dashed border-slate-200 dark:border-zinc-700">
                                        <img src={imagePreview || editItem.image} alt="Preview" className="w-full h-full object-cover" />
                                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="text-white mb-2" />
                                            <span className="text-white text-xs font-medium">Change Image</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        {(saving || uploadingImage) && (
                                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Item Name</label>
                                            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Price (Rs.)</label>
                                            <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Prep Time (Min)</label>
                                            <input type="number" value={editForm.prepTime} onChange={e => setEditForm({...editForm, prepTime: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                                        <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white appearance-none">
                                            {editableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                        <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white resize-none" />
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button onClick={closeEdit} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 transition-colors">Cancel</button>
                                    <button onClick={handleSave} disabled={saving || uploadingImage} className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${saveSuccess ? 'bg-emerald-500' : 'bg-primary'}`}>
                                        {saveSuccess ? <>✓ Saved</> : (saving || uploadingImage) ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving</> : <>Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
