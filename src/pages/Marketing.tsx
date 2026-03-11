import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Send, Info, Tag, Trash2, CheckCircle, Clock, Mail, BarChart, Users } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, onSnapshot, deleteDoc, doc, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Orders.module.css'; // borrowing some generic table styles

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
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>
                    Marketing & News
                </h1>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                    Send promotional deals or cafeteria updates to all students instantly.
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Compose Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={styles.ordersCard}
                        style={{ padding: '1.5rem', height: 'fit-content' }}
                    >
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Send size={18} className="text-primary" />
                            New Broadcast
                        </h2>

                        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Message Type
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setType('promo')}
                                        style={{
                                            padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid',
                                            borderColor: type === 'promo' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                            background: type === 'promo' ? 'hsla(var(--primary), 0.1)' : 'transparent',
                                            color: type === 'promo' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                            fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <Tag size={16} /> Promo Deal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('news')}
                                        style={{
                                            padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid',
                                            borderColor: type === 'news' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                            background: type === 'news' ? 'hsla(var(--primary), 0.1)' : 'transparent',
                                            color: type === 'news' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                            fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <Info size={16} /> Campus News
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. 🍔 Happy Hour: 50% Off!"
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))',
                                        color: 'hsl(var(--foreground))', outline: 'none'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Message Body
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    rows={4}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))',
                                        color: 'hsl(var(--foreground))', outline: 'none', resize: 'none'
                                    }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                    padding: '1rem', borderRadius: '0.75rem', background: success ? 'hsl(142, 71%, 45%)' : 'hsl(var(--primary))',
                                    color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                                    transition: 'all 0.3s', marginTop: '0.5rem'
                                }}
                            >
                                {sending ? (
                                    <Clock size={20} className="animate-spin" />
                                ) : success ? (
                                    <><CheckCircle size={20} /> Sent Successfully!</>
                                ) : (
                                    <><Megaphone size={20} /> Blast to All Users</>
                                )}
                            </button>
                        </form>
                    </motion.div>

                    {/* Weekly Newsletters Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={styles.ordersCard}
                        style={{ padding: '1.5rem', border: '1px solid hsl(var(--primary))', background: 'hsla(var(--primary), 0.02)' }}
                    >
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={18} className="text-primary" />
                            Weekly Newsletters
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                            Generate personalized spending summaries for students who have enabled the "Weekly Digest" setting.
                        </p>

                        <button
                            onClick={runWeeklyDigest}
                            disabled={generatingDigest}
                            style={{
                                width: '100%', padding: '0.85rem', borderRadius: '0.5rem',
                                background: 'white', border: '1px solid hsl(var(--primary))',
                                color: 'hsl(var(--primary))', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                            className="hover:bg-primary hover:text-white"
                        >
                            {generatingDigest ? (
                                <Clock size={16} className="animate-spin" />
                            ) : (
                                <><BarChart size={16} /> Trigger Weekly Digest Now</>
                            )}
                        </button>

                        {digestStatus && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'hsl(var(--secondary))', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--primary))' }}>
                                    <Users size={14} />
                                    {digestStatus}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* History Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={styles.ordersCard}
                    style={{ padding: '1.5rem' }}
                >
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        Broadcast History
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <AnimatePresence>
                            {recentNews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))' }}>
                                    <Megaphone size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                    <p>No broadcast history yet.</p>
                                </div>
                            ) : (
                                recentNews.map((news) => (
                                    <motion.div
                                        key={news.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            padding: '1rem', borderRadius: '0.75rem',
                                            background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                                                padding: '0.2rem 0.5rem', borderRadius: '4px',
                                                background: news.type === 'promo' ? 'hsla(25, 95%, 45%, 0.1)' : 'hsla(220, 80%, 60%, 0.1)',
                                                color: news.type === 'promo' ? 'hsl(25, 95%, 45%)' : 'hsl(220, 80%, 60%)'
                                            }}>
                                                {news.type}
                                            </span>
                                            <button 
                                                onClick={() => handleDelete(news.id)}
                                                style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{news.title}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.4' }}>{news.message}</p>
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', opacity: 0.6 }}>
                                            Sent on {news.createdAt?.toDate ? news.createdAt.toDate().toLocaleString() : 'Just now'}
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

