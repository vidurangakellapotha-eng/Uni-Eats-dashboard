import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch {
            // error is already set in AuthContext
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={styles.card}
            >
                <div className={styles.header}>
                    <motion.h1
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className={styles.title}
                    >
                        Uni Eats
                    </motion.h1>
                    <p className={styles.subtitle}>Employee Portal — Admin Access</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            background: 'hsla(0, 84%, 60%, 0.08)',
                            border: '1px solid hsla(0, 84%, 60%, 0.2)',
                            borderRadius: '0.75rem',
                            color: 'hsl(0, 84%, 50%)',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.inputField}
                            placeholder="employee@unieats.com"
                            disabled={submitting}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.inputField}
                            placeholder="••••••••"
                            disabled={submitting}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: submitting ? 1 : 1.02 }}
                        whileTap={{ scale: submitting ? 1 : 0.98 }}
                        type="submit"
                        className={styles.submitBtn}
                        disabled={submitting}
                        style={{ opacity: submitting ? 0.7 : 1 }}
                    >
                        {submitting ? 'Signing In...' : 'Sign In'}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
