import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, Mail, Trash2, Shield } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';
import { useAuth } from '../contexts/AuthContext';


export default function Staff() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOwner = user?.email === 'vidurangakellapotha@gmail.com';

    useEffect(() => {
        const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
            setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        const unsubInvites = onSnapshot(collection(db, 'employee_invites'), (snapshot) => {
            setInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { unsubAdmins(); unsubInvites(); };
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail || !isOwner) return;
        setIsSubmitting(true);
        try {
            // STEP 1: Optionally create the actual Firebase Auth user if a password is provided
            // We use a temporary secondary App instance so that the active Owner is NOT forcefully logged out!
            if (newPassword.trim().length > 0) {
                if (newPassword.length < 6) {
                    alert("Password must be at least 6 characters long.");
                    setIsSubmitting(false);
                    return;
                }
                const secondaryApp = initializeApp(firebaseConfig, "SecondaryTempApp");
                const secondaryAuth = getAuth(secondaryApp);
                try {
                    await createUserWithEmailAndPassword(secondaryAuth, newEmail.toLowerCase(), newPassword);
                } catch (authErr: any) {
                    if (authErr.code !== 'auth/email-already-in-use') {
                        throw authErr;
                    }
                }
                // Clean up the secondary app instance
                await deleteApp(secondaryApp);
            }

            // STEP 2: Write them to the whitelist so AuthContext escalates their clearance on login
            await setDoc(doc(db, 'employee_invites', newEmail.toLowerCase()), {
                email: newEmail.toLowerCase(),
                name: newName || 'Employee',
                role: 'employee',
                invitedAt: new Date().toISOString()
            });
            setNewEmail('');
            setNewName('');
            setNewPassword('');
            alert('Employee access granted successfully!');
        } catch (err: any) {
            console.error('Failed to grant access:', err);
            alert(`Failed: ${err.message || 'Make sure you are the Owner and the network is online.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeAdmin = async (id: string) => {
        if (!isOwner || !window.confirm('Revoke access for this employee?')) return;
        try {
            await deleteDoc(doc(db, 'admins', id));
        } catch (err) {
            console.error('Failed to revoke:', err);
        }
    };

    const removeInvite = async (email: string) => {
        if (!isOwner) return;
        try {
            await deleteDoc(doc(db, 'employee_invites', email));
        } catch (err) {
            console.error('Failed to revoke invite:', err);
        }
    };

    return (
        <div className="max-w-full overflow-hidden">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10 flex flex-col gap-1.5">
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                    Team <span className="text-orange-600">Access</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Security & Authorization</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <ShieldCheck className="text-emerald-500" />
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Employees</h2>
                        </div>
                        
                        {loading ? (
                            <p className="text-slate-400 text-sm">Loading security profiles...</p>
                        ) : (
                            <div className="space-y-4">
                                {admins.map(admin => (
                                    <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 font-black uppercase">
                                                {(admin.name || admin.email || 'A')[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{admin.name || 'Unnamed Employee'}</h3>
                                                <p className="text-xs text-slate-500">{admin.email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex items-center gap-4 w-full sm:w-auto">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-full sm:w-auto text-center border border-emerald-100">
                                                {admin.role || (admin.email === 'vidurangakellapotha@gmail.com' ? 'SYSTEM OWNER' : 'EMPLOYEE')}
                                            </span>
                                            {isOwner && admin.email !== 'vidurangakellapotha@gmail.com' && (
                                                <button onClick={() => removeAdmin(admin.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {invites.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                <Mail className="text-amber-500" />
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Invites</h2>
                            </div>
                            <div className="space-y-4">
                                {invites.map(invite => (
                                    <div key={invite.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{invite.name || 'Awaiting Setup'}</h3>
                                            <p className="text-xs text-slate-500">{invite.email}</p>
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex items-center gap-4 w-full sm:w-auto">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 w-full sm:w-auto text-center">WAITING FOR LOGIN</span>
                                            {isOwner && (
                                                <button onClick={() => removeInvite(invite.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <UserPlus className="text-primary" />
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Grant Access</h2>
                        </div>
                        
                        {!isOwner ? (
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
                                Only the System Owner (vidurangakellapotha@gmail.com) can authorize new employee access networks.
                            </div>
                        ) : (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Employee Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Google Email Account</label>
                                    <input
                                        type="email"
                                        required
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="employee@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Set Password (Optional)</label>
                                    <input
                                        type="text"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Leave blank for Google SSO only"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-orange-600 shadow-slate-900/10'}`}
                                >
                                    {isSubmitting ? (
                                        <><span className="material-icons-round animate-spin text-[14px]">sync</span> Processing...</>
                                    ) : (
                                        <><Shield size={14} /> Authorize Account</>
                                    )}
                                </button>
                                <p className="text-[10px] leading-relaxed text-slate-400 mt-4 text-center px-2">
                                    If you provide a password, the system generates an immediate application account. If left blank, they must use "Continue with Google".
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

