import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Apple, TrendingUp, Target, ShieldCheck, Smartphone } from 'lucide-react';
import FlyInHeading from '../components/motion/FlyInHeading';
import StaggerIn from '../components/motion/StaggerIn';

const FEATURES = [
  { icon: Dumbbell, title: 'Log Workouts', text: 'Sets, reps, weight, category, tags & notes — track every rep.' },
  { icon: Apple, title: 'Track Nutrition', text: 'Meals, macros & calories logged in seconds.' },
  { icon: TrendingUp, title: 'Visualize Progress', text: 'Weight, measurements & performance charts over time.' },
  { icon: Target, title: 'Set Goals', text: 'Weekly targets & reminders that keep you on track.' },
  { icon: ShieldCheck, title: 'Your Data, Secure', text: 'Encrypted passwords & private, per-account data.' },
  { icon: Smartphone, title: 'Works Everywhere', text: 'A clean, responsive experience on phone or desktop.' },
];

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-dot-grid" />
     <div className="landing-blob landing-blob-1" />
      <div className="landing-blob landing-blob-2" />
      <div className="landing-blob landing-blob-glow" />

      <div className="landing-content">
        <motion.div
          className="landing-icon"
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          🏋️
        </motion.div>

               {/* Heading ek dafa smoothly fade+rise ho kar settle hoti hai
            (~0.65s tak), uske baad tagline, buttons, aur features shuru hote hain */}
        <FlyInHeading
          text="Fitness Tracker"
          as="h1"
          className="landing-hero-heading"
          delay={0.15}
        />

        <motion.p
          className="landing-tagline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          Track your workouts, nutrition, and progress — all in one beautifully simple place.
        </motion.p>

        <motion.div
          className="landing-buttons"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
        >
          <Link to="/signup" className="landing-btn-primary">
            Get Started Free
          </Link>
          <Link to="/login" className="landing-btn-secondary">
            Login
          </Link>
        </motion.div>

        {/* Heading + tagline + buttons ke poora hone ke baad, cards ek ek
            karke (staggered) andar aati hain */}
        <StaggerIn className="landing-features" startDelay={1.1} staggerDelay={0.1}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div className="landing-feature-card" key={title}>
              <div className="landing-feature-icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
               </StaggerIn>

        <p className="landing-footer">
          <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
export default LandingPage;
