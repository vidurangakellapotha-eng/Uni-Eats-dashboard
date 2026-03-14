import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, writeBatch, doc } from 'firebase/firestore';
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    isAdmin: boolean;
    createdAt: any;
    chatId: string;
    read: boolean;
}

interface ChatSession {
    chatId: string;
    userName: string;
    lastMessage: string;
    timestamp: any;
    unreadCount: number;
}

const Chat: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch all message headers to group into sessions
    useEffect(() => {
        const q = query(collection(db, 'supportMessages'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const chatMap = new Map<string, ChatSession>();
            
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (!chatMap.has(data.chatId)) {
                    chatMap.set(data.chatId, {
                        chatId: data.chatId,
                        userName: data.senderName || 'Student',
                        lastMessage: data.text,
                        timestamp: data.createdAt,
                        unreadCount: 0
                    });
                }
                
                // If student message is unread, increment count
                if (!data.isAdmin && data.read === false) {
                    const session = chatMap.get(data.chatId);
                    if (session) session.unreadCount++;
                }
            });

            setSessions(Array.from(chatMap.values()));
        });

        return () => unsubscribe();
    }, []);

    // Mark messages as read when admin selects a chat
    useEffect(() => {
        if (!selectedChatId || messages.length === 0) return;

        const unreadMsgs = messages.filter(m => !m.isAdmin && m.read === false);
        if (unreadMsgs.length > 0) {
            const batch = writeBatch(db);
            unreadMsgs.forEach(m => {
                batch.update(doc(db, 'supportMessages', m.id), { read: true });
            });
            batch.commit().catch(err => console.error("Error marking messages read:", err));
        }
    }, [selectedChatId, messages]);

    // Fetch messages for selected chat
    useEffect(() => {
        if (!selectedChatId) return;

        // Using local sort to avoid Firestore composite index requirement
        const q = query(
            collection(db, 'supportMessages'),
            where('chatId', '==', selectedChatId)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
            
            // Local sort by timestamp
            msgs.sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeA - timeB;
            });

            setMessages(msgs);
        }, (err) => {
            console.error("Admin chat messages error:", err);
        });

        return () => unsubscribe();
    }, [selectedChatId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedChatId) return;

        const text = inputText;
        setInputText('');

        try {
            // 1. Send the message to the chat history
            await addDoc(collection(db, 'supportMessages'), {
                chatId: selectedChatId,
                text,
                senderId: 'admin',
                senderName: 'Uni Eats Admin',
                isAdmin: true,
                createdAt: serverTimestamp(),
                read: false
            });

            // 2. Also push a system notification to the student so they see a badge/toast
            await addDoc(collection(db, 'notifications'), {
                userId: selectedChatId,
                title: '🎧 Support Reply',
                message: text.length > 50 ? `${text.substring(0, 50)}...` : text,
                type: 'chat',
                icon: 'support_agent',
                color: '#6366F1',
                read: false,
                createdAt: serverTimestamp()
            });

        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const filteredSessions = sessions.filter(s => 
        s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.chatId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] bg-transparent gap-0 md:gap-6 px-0 md:px-1">
            {/* Sessions List - Hidden on mobile if a chat is selected */}
            <div className={`
                ${selectedChatId ? 'hidden md:flex' : 'flex'} 
                w-full md:w-[350px] lg:w-[400px] bg-white dark:bg-zinc-900 
                rounded-none md:rounded-[2.5rem] flex-col shadow-xl shadow-slate-200/50 
                dark:shadow-none border border-slate-100 dark:border-zinc-800 overflow-hidden
            `}>
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Nexus <span className="text-primary italic">Inbox</span></h2>
                        <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                            {filteredSessions.length} Active
                        </div>
                    </div>
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Identify Student ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center py-20">
                            <MessageSquare className="mx-auto mb-4 text-slate-200" size={48} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Transmissions Located</p>
                        </div>
                    ) : (
                        filteredSessions.map(session => (
                            <button 
                                key={session.chatId}
                                onClick={() => setSelectedChatId(session.chatId)}
                                className={`
                                    w-full text-left p-5 rounded-[2rem] transition-all duration-300 flex flex-col gap-1 relative overflow-hidden group
                                    ${selectedChatId === session.chatId 
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-400'}
                                `}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-black uppercase tracking-tight truncate pr-4">
                                        {session.userName}
                                    </span>
                                    <span className={`text-[10px] font-bold ${selectedChatId === session.chatId ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {session.timestamp?.toDate ? session.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <p className={`text-[12px] font-medium truncate ${selectedChatId === session.chatId ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {session.lastMessage}
                                </p>
                                {session.unreadCount > 0 && selectedChatId !== session.chatId && (
                                    <div className="absolute right-4 bottom-4 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-lg shadow-primary/40 animate-bounce">
                                        {session.unreadCount}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area - Visible on mobile if task selected */}
            <div className={`
                ${selectedChatId ? 'flex' : 'hidden md:flex'} 
                flex-1 bg-white dark:bg-zinc-900 rounded-none md:rounded-[2.5rem] 
                flex-col shadow-xl shadow-slate-200/50 dark:shadow-none 
                border border-slate-100 dark:border-zinc-800 overflow-hidden
            `}>
                {selectedChatId ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-5 md:px-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
                            <div className="flex items-center gap-4">
                                {selectedChatId && (
                                    <button 
                                        onClick={() => setSelectedChatId(null)}
                                        className="md:hidden p-2.5 -ml-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 active:scale-90 transition-all"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20 rotate-3">
                                    {sessions.find(s => s.chatId === selectedChatId)?.userName.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                        {sessions.find(s => s.chatId === selectedChatId)?.userName}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Transmission</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 bg-slate-50/30 dark:bg-black/5 custom-scrollbar"
                        >
                            {messages.map(msg => (
                                <div 
                                    key={msg.id}
                                    className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`
                                        max-w-[85%] md:max-w-[70%] px-6 py-4 rounded-[2rem] text-sm md:text-base font-bold shadow-sm
                                        ${msg.isAdmin 
                                            ? 'bg-slate-900 text-white rounded-tr-none' 
                                            : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none border border-slate-100 dark:border-zinc-700'}
                                    `}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest mt-2 px-2 uppercase">
                                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing...'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                            <form onSubmit={handleSend} className="flex gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Execute Reply Transmission..." 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="flex-1 px-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="px-6 md:px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={18} />
                                    <span className="hidden sm:inline">Dispatch</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-200 dark:text-zinc-700 mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <MessageSquare size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Nexus Terminal <span className="text-slate-300">Ready</span></h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-[280px]">Select a student frequency to begin secure communication.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
