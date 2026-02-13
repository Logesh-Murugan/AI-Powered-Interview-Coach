/**
 * ScaleButton Animation Component
 * Button with hover and tap animations
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScaleButtonProps {
  children: ReactNode;
  fullWidth?: boolean;
}

function ScaleButton({ children, fullWidth }: ScaleButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{ width: fullWidth ? '100%' : 'auto', display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
}

export default ScaleButton;
