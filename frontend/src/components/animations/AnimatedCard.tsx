/**
 * AnimatedCard Component
 * Card with hover lift effect
 */

import { motion } from 'framer-motion';
import { Paper, type PaperProps } from '@mui/material';

function AnimatedCard(props: PaperProps) {
  return (
    <motion.div
      whileHover={{ 
        y: -8, 
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)' 
      }}
      transition={{ duration: 0.3 }}
    >
      <Paper {...props} />
    </motion.div>
  );
}

export default AnimatedCard;
