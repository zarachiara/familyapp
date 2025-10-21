import { cn } from '@/lib/utils';

interface RatingScaleProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const RatingScale = ({ value, onChange, disabled = false }: RatingScaleProps) => {
  const ratings = [
    { value: 1, emoji: '😫', label: 'Hate it', color: 'text-red-500' },
    { value: 2, emoji: '😕', label: 'Dislike', color: 'text-orange-500' },
    { value: 3, emoji: '😐', label: 'Neutral', color: 'text-yellow-500' },
    { value: 4, emoji: '🙂', label: 'Like', color: 'text-green-500' },
    { value: 5, emoji: '😍', label: 'Love it', color: 'text-purple-500' },
  ];

  return (
    <div className="flex items-center justify-center space-x-2">
      {ratings.map(rating => (
        <button
          key={rating.value}
          type="button"
          onClick={() => !disabled && onChange(rating.value)}
          disabled={disabled}
          className={cn(
            'flex flex-col items-center p-3 rounded-lg transition-all',
            'hover:scale-110 hover:shadow-md',
            value === rating.value
              ? 'bg-purple-100 border-2 border-purple-500 scale-110'
              : 'bg-gray-50 border-2 border-transparent',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-3xl mb-1">{rating.emoji}</span>
          <span className={cn('text-xs font-medium', rating.color)}>
            {rating.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default RatingScale;