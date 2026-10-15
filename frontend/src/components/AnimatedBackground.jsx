import { motion } from 'framer-motion';

// Poori app ke peeche fixed, blurred, slowly drifting gradient shapes —
// an ambient, layered backdrop (not something the eye should track).
// Movement stays small and durations stay long so it reads as "alive"
// without ever feeling like it's "floating" at you.
function AnimatedBackground() {
  const blobs = [
    { color: '#1f9d8f', size: 520, top: '-14%', left: '-10%', duration: 34, range: [0, 18, -12, 0] },
    { color: '#ff8c42', size: 440, top: '52%', left: '82%', duration: 40, range: [0, -16, 12, 0] },
    { color: '#2bbfae', size: 400, top: '80%', left: '-4%', duration: 46, range: [0, 14, -10, 0] },
    { color: '#5fe3d1', size: 340, top: '15%', left: '56%', duration: 38, range: [0, -12, 16, 0] },
    { color: '#ffb67a', size: 300, top: '72%', left: '44%', duration: 42, range: [0, 10, -14, 0] },
  ];

  return (
    <div className="animated-bg" aria-hidden="true">
      <div className="animated-bg-grid" />
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="animated-bg-blob"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: b.color,
          }}
          animate={{
            x: b.range,
            y: [0, b.range[2] / 1.5, b.range[1] / 1.5, 0],
            scale: [1, 1.035, 0.98, 1],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default AnimatedBackground;