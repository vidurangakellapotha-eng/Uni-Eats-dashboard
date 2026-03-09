import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, BarChart3, Clock, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './LandingPage.module.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className={styles.container}>
            <div className={`${styles.orb} ${styles.orb1}`} />
            <div className={`${styles.orb} ${styles.orb2}`} />

            {/* Hero Section */}
            <section className={styles.hero}>
                <img src="/hero.png" alt="Hero" className={styles.heroImage} />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className={styles.heroContent}
                >
                    <div className={styles.badge}>
                        <Zap size={14} />
                        <span>Next-Gen Employee Portal</span>
                    </div>
                    <h1 className={styles.title}>
                        Manage <span className={styles.titleHighlight}>Uni Eats</span><br />
                        with Precision.
                    </h1>
                    <p className={styles.description}>
                        The ultimate command center for university food services.
                        Streamline orders, manage inventory, and analyze growth in real-time.
                    </p>
                    <div className={styles.ctaGroup}>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-primary"
                            style={{ fontSize: '1.125rem', padding: '1rem 2.5rem', gap: '0.75rem' }}
                        >
                            Enter Portal <ArrowRight size={20} />
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '1.125rem', padding: '1rem 2.5rem' }}
                        >
                            Documentation
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <div className={styles.featureGrid}>
                    <motion.div
                        whileHover={{ y: -10 }}
                        className={styles.featureCard}
                    >
                        <div className={styles.iconWrapper}>
                            <ChefHat size={24} />
                        </div>
                        <h3 className={styles.featureTitle}>Order Control</h3>
                        <p className={styles.featureDescription}>
                            Real-time order tracking with instant status updates and beautiful visual feedback.
                        </p>
                    </motion.div>

                    <motion.div
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -10 }}
                        className={styles.featureCard}
                    >
                        <div className={styles.iconWrapper}>
                            <Clock size={24} />
                        </div>
                        <h3 className={styles.featureTitle}>Inventory Sync</h3>
                        <p className={styles.featureDescription}>
                            Automatic stock adjustments and instant availability toggles for the entire menu.
                        </p>
                    </motion.div>

                    <motion.div
                        transition={{ delay: 0.2 }}
                        whileHover={{ y: -10 }}
                        className={styles.featureCard}
                    >
                        <div className={styles.iconWrapper}>
                            <BarChart3 size={24} />
                        </div>
                        <h3 className={styles.featureTitle}>Deep Analytics</h3>
                        <p className={styles.featureDescription}>
                            Advanced selling analysis, peak hour tracking, and revenue forecasting at your fingertips.
                        </p>
                    </motion.div>

                    <motion.div
                        transition={{ delay: 0.3 }}
                        whileHover={{ y: -10 }}
                        className={styles.featureCard}
                    >
                        <div className={styles.iconWrapper}>
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className={styles.featureTitle}>Secure Access</h3>
                        <p className={styles.featureDescription}>
                            Role-based authentication ensuring only authorized personnel access sensitive data.
                        </p>
                    </motion.div>
                </div>
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2026 Uni Eats Operations. All rights reserved.</p>
                <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>Designed for high-performance cafeteria management.</p>
            </footer>
        </div>
    );
}
