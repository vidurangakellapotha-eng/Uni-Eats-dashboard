import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed, LogOut, Package, BarChart2, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Orders', path: '/orders', icon: Package },
        { name: 'Availability', path: '/availability', icon: UtensilsCrossed },
        { name: 'Marketing', path: '/marketing', icon: Megaphone },
        { name: 'Analytics', path: '/analytics', icon: BarChart2 },
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
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
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
