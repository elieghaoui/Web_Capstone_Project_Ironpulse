import { motion } from 'framer-motion';

// Wraps every page so it slides in and out when the route changes.
export default function PageTransition({ children }) {
  return (
    <motion.main
      className="page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}
