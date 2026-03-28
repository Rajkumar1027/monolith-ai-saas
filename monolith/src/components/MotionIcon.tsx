import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface MotionIconProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export const MotionIcon: React.FC<MotionIconProps> = ({ children, className, scale = 1.1 }) => (
  <motion.div 
    whileHover={{ scale, backgroundColor: "rgba(255, 255, 255, 0.05)" }} 
    whileTap={{ scale: 0.95 }}
    className={cn("inline-flex items-center justify-center transition-all duration-300 rounded-full p-1", className)}
  >
    {children}
  </motion.div>
);
