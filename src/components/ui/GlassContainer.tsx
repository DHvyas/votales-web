import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
}

const blurStyles = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

export const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ blur = 'md', className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          blurStyles[blur],
          'bg-white/5 border border-white/15 shadow-xl rounded-2xl',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
          'hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)]',
          'transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassContainer.displayName = 'GlassContainer';

export default GlassContainer;
