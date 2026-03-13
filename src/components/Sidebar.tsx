
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  UtensilsCrossed, 
  LogOut, 
  Package, 
  MessageSquare, 
  Menu, 
  X,
  Settings,
  PlusCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  History,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadSupport, setUnreadSupport] = useState(0);
      const [isOpen, setIsOpen] = useState(false);

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
        {
            id: 'menu',
            name: 'Menu & Inventory',
            icon: UtensilsCrossed,
            subItems: [
                { name: 'Stock Availability', path: '/availability', icon: CheckCircle2 },
                { name: 'Categories', path: '/availability', icon: PlusCircle },
            ]
        },
        {
            id: 'orders',
            name: 'Order Management',
            icon: Package,
            subItems: [
                { name: 'Live Orders', path: '/orders', icon: Clock },
                { name: 'Order Logs', path: '/dashboard', icon: History },
            ]
        },
        {
            id: 'account',
            name: 'Business Account',
            icon: Settings,
            subItems: [
                { name: 'Analytics', path: '/analytics', icon: TrendingUp },
                { name: 'Marketing', path: '/marketing', icon: Megaphone },
                { name: 'Support Inbox', path: '/chat', icon: MessageSquare, hasBadge: unreadSupport > 0 },
            ]
        }
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) return null;

    const displayName = user.displayName || user.email || 'Admin User';
    const initial = displayName.charAt(0).toUpperCase();

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            {/* Mobile Header with Glassmorphism */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 flex items-center justify-between z-[100]">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-1 overflow-hidden border border-white/20">
                        <img src="/logo.png" alt="Uni Eats" className="w-full h-full object-cover scale-110" />
                    </div>
                    <span className="font-black tracking-tighter uppercase text-sm">Uni Eats <span className="text-orange-600">Ops</span></span>
                </div>
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="p-2 rounded-xl bg-slate-50 text-slate-600 active:scale-90 transition-all"
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] md:hidden" 
                    onClick={() => setIsOpen(false)} 
                />
            )}

            {/* High-End Web Sidebar (Left Rail) */}
            <aside className={`fixed top-0 left-0 h-screen w-72 bg-white border-r border-slate-100 flex flex-col z-[100] transition-transform duration-500 sm:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Brand */}
                <div className="p-8">
                    <Link to="/dashboard" className="flex items-center gap-4 group">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-all duration-700 overflow-hidden border-2 border-slate-50">
                            <img src="/logo.png" alt="Uni Eats" className="w-full h-full object-cover scale-110" />
                        </div>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Uni Eats <span className="text-orange-600 font-bold text-lg">Ops</span></span>
                    </Link>
                </div>

                {/* Main Nav */}
                <nav className="flex-1 px-4 overflow-y-auto space-y-8 py-4 custom-scrollbar">
                    {/* Overview Static Link */}
                    <div className="space-y-1">
                        <Link
                            to="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive('/dashboard') ? 'bg-slate-900 text-white font-black shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}
                        >
                            <Home size={20} />
                            <span className="text-sm tracking-tight">Overview Nexus</span>
                        </Link>
                    </div>

                    {/* Section Groups */}
                    {navItems.map((section) => (
                        <div key={section.id} className="space-y-2">
                             <div className="px-4 flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{section.name}</p>
                             </div>
                             <div className="space-y-1">
                                {section.subItems.map((subItem) => (
                                    <Link
                                        key={subItem.path + subItem.name}
                                        to={subItem.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive(subItem.path) ? 'bg-orange-50 text-orange-600 font-black' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <subItem.icon size={18} className={`transition-transform duration-500 ${isActive(subItem.path) ? 'scale-110' : 'group-hover:scale-110'}`} />
                                            <span className="text-sm tracking-tight">{subItem.name}</span>
                                        </div>
                                        {subItem.hasBadge && (
                                            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse border-2 border-orange-50" />
                                        )}
                                    </Link>
                                ))}
                             </div>
                        </div>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-50">
                    <div className="bg-slate-50 rounded-[2rem] p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black uppercase text-sm overflow-hidden border border-slate-200">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    initial
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Control</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="w-full py-2.5 rounded-xl bg-white text-red-500 text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={14} />
                            Log Out Portal
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
