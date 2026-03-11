import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { Send, Search, MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    isAdmin: boolean;
    createdAt: any;
    chatId: string;
}

interface ChatSession {
    chatId: string;
    userName: string;
    lastMessage: string;
    timestamp: any;
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
                        timestamp: data.createdAt
                    });
                }
            });

            setSessions(Array.from(chatMap.values()));
        });

        return () => unsubscribe();
    }, []);

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
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '1.5rem', padding: '1.5rem' }}>
            {/* Sessions List */}
            <div style={{ 
                width: '350px', 
                background: 'white', 
                borderRadius: '1.25rem', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>Support Chats</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search students..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '0.625rem 0.75rem 0.625rem 2.5rem', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '0.75rem',
                                outline: 'none',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredSessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No chats found</div>
                    ) : (
                        filteredSessions.map(session => (
                            <div 
                                key={session.chatId}
                                onClick={() => setSelectedChatId(session.chatId)}
                                style={{ 
                                    padding: '1.25rem', 
                                    borderBottom: '1px solid #f1f5f9', 
                                    cursor: 'pointer',
                                    background: selectedChatId === session.chatId ? 'hsl(var(--primary) / 0.05)' : 'transparent',
                                    borderLeft: selectedChatId === session.chatId ? '4px solid hsl(var(--primary))' : '4px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{session.userName}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {session.timestamp?.toDate ? session.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <p style={{ 
                                    fontSize: '0.875rem', 
                                    color: '#64748b', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    margin: 0
                                }}>
                                    {session.lastMessage}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ 
                flex: 1, 
                background: 'white', 
                borderRadius: '1.25rem', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
            }}>
                {selectedChatId ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ 
                            padding: '1.25rem', 
                            borderBottom: '1px solid #e2e8f0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem',
                            background: '#f8fafc' 
                        }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {sessions.find(s => s.chatId === selectedChatId)?.userName.charAt(0) || 'S'}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{sessions.find(s => s.chatId === selectedChatId)?.userName}</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Student User</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div 
                            ref={scrollRef}
                            style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f1f5f9' }}
                        >
                            {messages.map(msg => (
                                <div 
                                    key={msg.id}
                                    style={{ 
                                        alignSelf: msg.isAdmin ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: msg.isAdmin ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div style={{ 
                                        padding: '0.75rem 1rem', 
                                        borderRadius: '1rem', 
                                        fontSize: '0.925rem',
                                        background: msg.isAdmin ? 'hsl(var(--primary))' : 'white',
                                        color: msg.isAdmin ? 'white' : '#1e293b',
                                        boxShadow: '0 1px 2px rgb(0 0 0 / 0.05)',
                                        border: msg.isAdmin ? 'none' : '1px solid #e2e8f0'
                                    }}>
                                        {msg.text}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', padding: '0 0.5rem' }}>
                                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div style={{ padding: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="Type your reply..." 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    style={{ 
                                        flex: 1, 
                                        padding: '0.75rem 1rem', 
                                        border: '2px solid #f1f5f9', 
                                        borderRadius: '0.75rem',
                                        outline: 'none',
                                        fontSize: '0.925rem',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = 'hsl(var(--primary))'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#f1f5f9'}
                                />
                                <button 
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    style={{ 
                                        background: 'hsl(var(--primary))', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '0.75rem', 
                                        padding: '0.75rem 1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        opacity: inputText.trim() ? 1 : 0.5
                                    }}
                                >
                                    <Send size={18} />
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#94a3b8',
                        gap: '1rem'
                    }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={48} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ color: '#64748b', margin: '0 0 0.5rem 0' }}>Select a chat to reply</h3>
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>View and respond to student inquiries in real-time</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
