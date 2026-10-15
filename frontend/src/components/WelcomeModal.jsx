import { useState, useEffect } from 'react';
import { Dumbbell, UtensilsCrossed, Target, FileText, X } from 'lucide-react';

const SLIDES = [
  {
    icon: Dumbbell,
    title: 'Workouts',
    text: 'Har workout log karein: exercise, sets, reps aur duration. Calories khud estimate ho jati hain, aur streak aur milestones par notification milti hai.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Nutrition',
    text: 'Khana aur calories add karein, protein/carbs/fats dekhein. Nutrition Analytics mein charts se pata chalta hai ke aap kitna kha rahe hain.',
  },
  {
    icon: Target,
    title: 'Goals',
    text: 'Target weight, weekly workouts aur daily calories set karein. Dashboard par progress dikhta hai, aur goal poora hone par notification aati hai.',
  },
  {
    icon: FileText,
    title: 'Reports',
    text: 'Apna saara data CSV ya PDF mein export karein, taake doctor, trainer ya apne record ke liye sath rakh sakein.',
  },
];

const storageKey = (userId) => `welcomeSeen:${userId}`;

const wasSeen = (userId) => {
  try {
    return localStorage.getItem(storageKey(userId)) === '1';
  } catch {
    return true; // storage na chale to popup bar bar na aaye
  }
};

// Pehli dafa login par ek baar dikhta hai; "Got it" (ya Skip/X/Esc) ke baad dobara nahi aata
function WelcomeModal({ userId }) {
  const [open, setOpen] = useState(() => !wasSeen(userId));
  const [step, setStep] = useState(0);

  const close = () => {
    try {
      localStorage.setItem(storageKey(userId), '1');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="welcome-backdrop">
      <div className="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <button className="welcome-close" onClick={close} aria-label="Close welcome">
          <X size={18} />
        </button>

        <p className="welcome-kicker">Welcome! Yahan se shuru karein</p>
        <div className="welcome-icon">
          <Icon size={32} />
        </div>
        <h2 id="welcome-title">{slide.title}</h2>
        <p className="welcome-text">{slide.text}</p>

        <div className="welcome-dots" aria-hidden="true">
          {SLIDES.map((s, i) => (
            <span key={s.title} className={`welcome-dot ${i === step ? 'welcome-dot-active' : ''}`} />
          ))}
        </div>

        <div className="welcome-actions">
          {step > 0 ? (
            <button className="welcome-secondary" onClick={() => setStep(step - 1)}>Back</button>
          ) : (
            <button className="welcome-secondary" onClick={close}>Skip</button>
          )}
          {isLast ? (
            <button onClick={close}>Got it</button>
          ) : (
            <button onClick={() => setStep(step + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;