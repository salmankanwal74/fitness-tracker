export const EASE = [0.16, 1, 0.3, 1];

// Container: reveals its children one after another (staggered).
export const staggerContainer = (staggerDelay = 0.07, startDelay = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: startDelay,
    },
  },
});


export const fadeUpItem = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE },
  },
};


export const revealHeading = (delay = 0) => ({
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay },
  },
});