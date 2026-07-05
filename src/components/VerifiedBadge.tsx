import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  verificationType?: string | null;
  className?: string;
}

const VerifiedBadge = ({ verificationType, className }: VerifiedBadgeProps) => {
  // pro/green = green tick, basic/blue or default = blue tick
  const isGreen = verificationType === 'pro' || verificationType === 'green';
  
  return (
    <BadgeCheck
      className={cn(
        'flex-shrink-0',
        isGreen ? 'text-emerald-400' : 'text-blue-400',
        className
      )}
    />
  );
};

export default VerifiedBadge;
