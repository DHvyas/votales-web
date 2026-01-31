import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: 'glass' | 'solid' | 'subtle';
  hoverable?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  glass: 'backdrop-blur-md bg-white/5 border border-white/15 shadow-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
  solid: 'bg-slate-900/80 border border-slate-800 shadow-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
  subtle: 'backdrop-blur-sm bg-white/[0.02] border border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
};

const hoverStyles = {
  glass: 'hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.1)]',
  solid: 'hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
  subtle: 'hover:border-violet-500/20 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'glass', hoverable = false, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={
          hoverable
            ? {
                y: -4,
                transition: { duration: 0.2 },
              }
            : undefined
        }
        className={cn(
          'rounded-2xl transition-all duration-300',
          variantStyles[variant],
          hoverable && `cursor-pointer ${hoverStyles[variant]}`,
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-b border-white/10', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-t border-white/10', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
