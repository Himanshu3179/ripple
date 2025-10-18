type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name?: string | null;
  color?: string | null;
  size?: AvatarSize;
}

const Avatar = ({ name, color, size = 'md' }: AvatarProps) => {
  const baseSize =
    size === 'lg' ? 'h-12 w-12 text-lg' : size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base';
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div
      className={`grid place-items-center rounded-full font-semibold text-white shadow-card ${baseSize}`}
      style={{ backgroundColor: color || '#3f5fff' }}
    >
      {initial}
    </div>
  );
};

export default Avatar;
