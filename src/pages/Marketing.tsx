import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Send, Info, Tag, Trash2, CheckCircle, Clock, Mail, BarChart, Users } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, onSnapshot, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Marketing() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('promo'); // promo or news
    const [sending, setSending] = useState(false);
    const [recentNews, setRecentNews] = useState<any[]>([]);
    const [success, setSuccess] = useState(false);
    
    // Digest states
    const [generatingDigest, setGeneratingDigest] = useState(false);
    const [digestStatus, setDigestStatus] = useState('');

    useEffect(() => {
        // Fetch only global 'all' notifications to see history
        const q = query(
            collection(db, 'notifications'), 
            where('userId', '==', 'all')
        );
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by createdAt manually if index is slow
            data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setRecentNews(data);
        });
        return () => unsubscribe();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return;

        setSending(true);
        try {
            await addDoc(collection(db, 'notifications'), {
                userId: 'all', // Broadcast to everyone
                title,
                message,
                type,
                read: false,
                createdAt: serverTimestamp()
            });
            setTitle('');
            setMessage('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to send broadcast:", err);
            alert("Failed to send. Check console.");
        } finally {
            setSending(false);
        }
    };

    const runWeeklyDigest = async () => {
        if (!confirm('Start generating weekly spending summaries for students? This will process all orders from the last 7 days.')) return;

        setGeneratingDigest(true);
        setDigestStatus('Fetching opted-in users...');

        try {
            // 1. Get users who enabled email digest
            const usersSnap = await getDocs(collection(db, 'users'));
            const optedInUsers = usersSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as any))
                .filter(u => u.notificationSettings?.emailDigest === true);

            if (optedInUsers.length === 0) {
                setDigestStatus('No users have opted-in for weekly digests.');
                setTimeout(() => setDigestStatus(''), 3000);
                return;
            }

            setDigestStatus(`Processing ${optedInUsers.length} summaries...`);

            // 2. Get last 7 days orders
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const ordersSnap = await getDocs(query(
                collection(db, 'orders'),
                where('status', '==', 'COMPLETED')
                // Note: We'd normally filter by date in query, but index might be missing
            ));

            const recentOrders = ordersSnap.docs
                .map(d => d.data())
                .filter(o => {
                    const ts = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : 0;
                    return ts > sevenDaysAgo.getTime();
                });

            // 3. Send emails via 'mail' collection (Firebase Trigger Email extension format)
            let sentCount = 0;
            for (const user of optedInUsers) {
                const userOrders = recentOrders.filter(o => o.userId === user.id);
                const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                if (totalSpent > 0) {
                    await addDoc(collection(db, 'mail'), {
                        to: user.email,
                        message: {
                            subject: `Your Weekly Uni-Eats Summary 🍱`,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2 style="color: #f97316;">Weekly Spending Digest</h2>
                                    <p>Hi ${user.name || 'Student'},</p>
                                    <p>Here is your spending summary for the past 7 days at Uni-Eats:</p>
                                    <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #fbcfe8;">
                                        <div style="font-size: 12px; text-transform: uppercase; color: #be185d; font-weight: bold;">Weekly Total</div>
                                        <div style="font-size: 32px; font-weight: 900; color: #be185d;">Rs. ${totalSpent.toLocaleString()}</div>
                                        <div style="font-size: 14px; margin-top: 5px; color: #86198f;">Total Orders: ${userOrders.length}</div>
                                    </div>
                                    <p style="font-size: 14px; color: #666;">Keep enjoying your meals!</p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                                    <p style="font-size: 10px; color: #999;">You received this because you enabled "Weekly Digest" in your NIBM Uni-Eats app settings.</p>
                                </div>
                            `
                        },
                        createdAt: serverTimestamp()
                    });
                    sentCount++;
                }
            }

            setDigestStatus(`Success! Sent ${sentCount} digest emails.`);
            setTimeout(() => setDigestStatus(''), 5000);
        } catch (err) {
            console.error("Digest failed:", err);
            setDigestStatus('Error processing digest. Check console.');
        } finally {
            setGeneratingDigest(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to remove this news? It will disappear for all students.')) {
            await deleteDoc(doc(db, 'notifications', id));
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-1 sm:px-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                        Nexus <span className="text-primary italic">Marketing</span>
                    </h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Broadcast Control Center</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-5 flex flex-col gap-10">
                    {/* Compose Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-zinc-800"
                    >
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                            <Send size={20} className="text-primary" />
                            Global Transmission
                        </h2>

                        <form onSubmit={handleSend} className="flex flex-col gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Frequency Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setType('promo')}
                                        className={`
                                            p-4 rounded-2xl border-none font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                                            ${type === 'promo' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                                        `}
                                    >
                                        <Tag size={16} /> Promo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('news')}
                                        className={`
                                            p-4 rounded-2xl border-none font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                                            ${type === 'news' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                                        `}
                                    >
                                        <Info size={16} /> News
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Transmission Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Execute Title..."
                                    className="w-full p-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Broadcast Content
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    rows={4}
                                    className="w-full p-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className={`
                                    flex items-center justify-center gap-3 p-5 rounded-2xl border-none font-black text-xs uppercase tracking-widest transition-all
                                    ${success ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'}
                                    disabled:opacity-50 active:scale-95
                                `}
                            >
                                {sending ? (
                                    <Clock size={20} className="animate-spin" />
                                ) : success ? (
                                    <><CheckCircle size={20} /> Success</>
                                ) : (
                                    <><Megaphone size={20} /> Blast to All</>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    {/* Weekly Newsletters Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-emerald-50/50 dark:bg-zinc-800/20 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-zinc-800"
                    >
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                            <Mail size={20} className="text-emerald-600" />
                            Email Digests
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                            Sync spending summaries with opted-in student frequencies.
                        </p>

                        <button
                            onClick={runWeeklyDigest}
                            disabled={generatingDigest}
                            className="w-full p-4 bg-white dark:bg-zinc-800 text-emerald-600 border border-emerald-600/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            {generatingDigest ? (
                                <Clock size={16} className="animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-2"><BarChart size={16} /> Run System Sync</span>
                            )}
                        </button>

                        {digestStatus && (
                            <div className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-2xl flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                <Users size={14} />
                                {digestStatus}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* History Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-7 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-zinc-800 flex flex-col"
                >
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">
                        Transmission Logs
                    </h2>

                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
                        <AnimatePresence>
                            {recentNews.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <Megaphone size={48} className="text-slate-100 mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Historical Logs Found</p>
                                </div>
                            ) : (
                                recentNews.map((news) => (
                                    <motion.div
                                        key={news.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 relative group overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`
                                                px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest
                                                ${news.type === 'promo' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                                            `}>
                                                {news.type}
                                            </span>
                                            <button 
                                                onClick={() => handleDelete(news.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-sm mb-2 uppercase tracking-tight">{news.title}</h3>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{news.message}</p>
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={10} />
                                            {news.createdAt?.toDate ? news.createdAt.toDate().toLocaleString() : 'Recent Transmission'}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

