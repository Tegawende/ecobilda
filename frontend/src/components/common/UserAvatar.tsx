import { IconUser } from '@tabler/icons-react';

interface UserAvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function UserAvatar({
  src,
  firstName = '',
  lastName = '',
  size = 'md',
  className = '',
  showBorder = false,
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const borderClass = showBorder ? 'border-2 border-eco-primary' : '';

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        referrerPolicy="no-referrer"
        crossOrigin={undefined}
        className={`${sizeClass} rounded-full object-cover ${borderClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gray-100 flex items-center justify-center ${borderClass} ${className}`}
    >
      <IconUser size={iconSizes[size]} className="text-gray-400" />
    </div>
  );
}
