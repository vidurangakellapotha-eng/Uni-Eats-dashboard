import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed, LogOut, Package, BarChart2, Megaphone, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Sidebar.module.css';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadSupport, setUnreadSupport] = useState(0);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'supportMessages'),
            where('isAdmin', '==', false),
            where('read', '==', false)
        );
        const unsubscribe = onSnapshot(q, (snap) => {
            setUnreadSupport(snap.size);
        });
        return () => unsubscribe();
    }, [user]);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Orders', path: '/orders', icon: Package },
        { name: 'Availability', path: '/availability', icon: UtensilsCrossed },
        { name: 'Marketing', path: '/marketing', icon: Megaphone },
        { name: 'Analytics', path: '/analytics', icon: BarChart2 },
        { name: 'Support', path: '/chat', icon: MessageSquare, hasBadge: unreadSupport > 0 },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) return null;

    const displayName = user.displayName || user.email || 'Admin';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <aside className={styles.sidebar}>
            <Link to="/dashboard" className={styles.logo} style={{ textDecoration: 'none' }}>
                <UtensilsCrossed size={32} />
                <span>Uni Eats</span>
            </Link>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                            style={{ position: 'relative' }}
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                            {item.hasBadge && (
                                <span style={{
                                    position: 'absolute',
                                    right: '1.25rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '8px',
                                    height: '8px',
                                    background: '#ef4444',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.15)',
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.userProfile}>
                <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '0.875rem'
                }}>
                    {initial}
                </div>
                <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.displayName || 'Admin'}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
}
