import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { ShieldX } from 'lucide-react';

export default function Layout() {
    const { isAuthenticated, isAdmin, loading, logout } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'hsl(var(--background))',
                flexDirection: 'column', gap: '1rem'
            }}>
                <div style={{
                    width: '40px', height: '40px',
                    border: '3px solid hsl(var(--border))',
                    borderTop: '3px solid hsl(var(--primary))',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                    Connecting to Uni Eats...
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but NOT an admin
    if (!isAdmin) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'hsl(var(--background))',
                flexDirection: 'column', gap: '1.5rem', padding: '2rem', textAlign: 'center'
            }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'hsla(0, 84%, 60%, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <ShieldX size={40} color="hsl(0, 84%, 50%)" />
                </div>
                <div>
                    <h1 style={{
                        fontSize: '1.5rem', fontWeight: '700',
                        color: 'hsl(var(--foreground))', marginBottom: '0.5rem'
                    }}>
                        Access Denied
                    </h1>
                    <p style={{
                        color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem',
                        maxWidth: '360px', lineHeight: '1.6'
                    }}>
                        You don't have admin permissions to access this dashboard.
                        Please contact the Uni Eats administrator.
                    </p>
                </div>
                <button
                    onClick={logout}
                    style={{
                        padding: '0.75rem 2rem', borderRadius: '0.75rem',
                        background: 'hsl(var(--primary))', color: 'white',
                        border: 'none', fontWeight: '600', cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFDF5] selection:bg-primary/20 selection:text-primary">
            {/* Sidebar Infrastructure */}
            <Sidebar />
            
            {/* Core Application Layer */}
            <main className="md:pl-72 min-h-screen transition-all duration-500 ease-in-out">
                {/* Internal Page Viewport */}
                <div className="w-full h-full pt-20 md:pt-6 lg:pt-8">
                    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
