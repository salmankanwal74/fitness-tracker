import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '../../utils/motionVariants';


function StaggerIn({ children, className = '', staggerDelay = 0.08, startDelay = 0 }) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <motion.div
      className={className}
      variants={staggerContainer(staggerDelay, startDelay)}
      initial="hidden"
      animate="show"
    >
      {items.map((child, i) => (
        <motion.div key={child?.key ?? i} variants={fadeUpItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default StaggerIn;
