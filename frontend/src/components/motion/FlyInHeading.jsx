import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Classic letter-by-letter "typewriter" reveal — each character appears
// one at a time (so a word's spelling visibly completes), with a blinking
// cursor that fades away once the whole heading is typed. Runs ONCE per
// mount — no looping, no re-typing while the user is reading.
function FlyInHeading({
  text,
  as = 'h1',
  className = '',
  delay = 0,
  accentLastWord = false,
  speed = 55, // ms per CHARACTER — raise for slower, lower for faster
}) {
  const Tag = as;
  const chars = Array.from(text); // Array.from so emoji aren't split in half
  const [count, setCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setCount(0);
    setShowCursor(true);

    let stepId;
    let hideId;

    const startId = setTimeout(() => {
      let i = 0;
      stepId = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= chars.length) {
          clearInterval(stepId);
          // Thodi der (650ms) cursor dikhta rehta hai, phir fade ho jata hai
          hideId = setTimeout(() => setShowCursor(false), 650);
        }
      }, speed);
    }, delay * 1000);

    return () => {
      clearTimeout(startId);
      clearInterval(stepId);
      clearTimeout(hideId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, speed]);

  // Accent ke liye "last word" kahan se shuru hoti hai, wo index nikal lete hain
  const lastSpace = text.lastIndexOf(' ');
  const accentStartIndex = accentLastWord ? (lastSpace === -1 ? 0 : lastSpace + 1) : null;

  const gradientStyle = {
    backgroundImage: 'linear-gradient(135deg, var(--text-dark, #1a2e35) 30%, var(--primary, #1f9d8f) 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
  const accentStyle = { color: 'var(--accent, #ff8c42)' };

  const shownChars = chars.slice(0, count);
  const splitAt = accentStartIndex === null ? shownChars.length : Math.min(count, accentStartIndex);
  const normalPart = shownChars.slice(0, splitAt).join('');
  const accentPart = shownChars.slice(splitAt).join('');

  return (
        <Tag className={className}>
      {/* Screen reader ko poora text milta hai, typing animation ko nahi */}
      <span className="sr-only">{text}</span>
      <span style={gradientStyle} aria-hidden="true">{normalPart}</span>
      {accentLastWord && accentPart && (
        <span style={accentStyle} aria-hidden="true">
          {accentPart}
        </span>
      )}
      {showCursor && (
        <motion.span
          aria-hidden="true"
          className="typing-cursor"
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: 'linear' }}
        >
          |
        </motion.span>
      )}
    </Tag>
  );
}

export default FlyInHeading;