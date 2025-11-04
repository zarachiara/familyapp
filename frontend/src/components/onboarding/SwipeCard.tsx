import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ThumbsDown, ThumbsUp, Sparkles } from 'lucide-react';
import { OnboardingTask, SwipeRating } from '@/types/onboarding';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeCardProps {
  task: OnboardingTask;
  onSwipe: (rating: SwipeRating) => void;
  isActive: boolean;
}

const SwipeCard = ({ task, onSwipe, isActive }: SwipeCardProps) => {
  const isMobile = useIsMobile();
  const [exitX, setExitX] = useState(0);
  const [exitY, setExitY] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const cardRef = useRef<HTMLDivElement>(null);

  // Determine swipe direction indicators
  const showLove = useTransform(x, [50, 200], [0, 1]);
  const showHate = useTransform(x, [-200, -50], [1, 0]);
  const showUntried = useTransform(y, [-200, -50], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    
    // Right swipe - Love it
    if (info.offset.x > threshold) {
      setExitX(300);
      onSwipe('love');
    }
    // Left swipe - Hate it
    else if (info.offset.x < -threshold) {
      setExitX(-300);
      onSwipe('hate');
    }
    // Up swipe - Haven't tried it
    else if (info.offset.y < -threshold) {
      setExitY(-300);
      onSwipe('untried');
    }
    // Tap/Click - Neutral
    else if (Math.abs(info.offset.x) < 10 && Math.abs(info.offset.y) < 10) {
      onSwipe('neutral');
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isActive) return;
    
    switch (e.key) {
      case 'ArrowRight':
        setExitX(300);
        onSwipe('love');
        break;
      case 'ArrowLeft':
        setExitX(-300);
        onSwipe('hate');
        break;
      case 'ArrowUp':
        setExitY(-300);
        onSwipe('untried');
        break;
      case ' ':
      case 'Enter':
        onSwipe('neutral');
        break;
    }
  };

  useEffect(() => {
    if (isActive && !isMobile) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isActive, isMobile]);

  const getDomainColor = (domain: OnboardingTask['domain']) => {
    const colors = {
      kitchen: 'bg-orange-100 text-orange-700',
      maintenance: 'bg-blue-100 text-blue-700',
      care: 'bg-pink-100 text-pink-700',
      planning: 'bg-purple-100 text-purple-700',
      cleaning: 'bg-green-100 text-green-700',
      outdoor: 'bg-teal-100 text-teal-700',
    };
    return colors[domain];
  };

  const getDomainEmoji = (domain: OnboardingTask['domain']) => {
    const emojis = {
      kitchen: '🥘',
      maintenance: '🧺',
      care: '🐶',
      planning: '💻',
      cleaning: '🧹',
      outdoor: '🌳',
    };
    return emojis[domain];
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ x, y, rotate, opacity }}
      drag={isActive}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 || exitY !== 0 ? { x: exitX, y: exitY, opacity: 0 } : {}}
      transition={{ duration: 0.3 }}
      className="absolute w-full cursor-grab active:cursor-grabbing"
    >
      <Card className="relative overflow-hidden shadow-2xl border-2 border-gray-200 bg-white">
        {/* Swipe Indicators */}
        <motion.div
          style={{ opacity: showLove }}
          className="absolute top-4 right-4 z-10 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg flex items-center gap-2 rotate-12"
        >
          <Heart className="w-5 h-5 fill-current" />
          LOVE IT
        </motion.div>

        <motion.div
          style={{ opacity: showHate }}
          className="absolute top-4 left-4 z-10 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg flex items-center gap-2 -rotate-12"
        >
          <ThumbsDown className="w-5 h-5" />
          HATE IT
        </motion.div>

        <motion.div
          style={{ opacity: showUntried }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          HAVEN'T TRIED
        </motion.div>

        {/* Card Content */}
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{getDomainEmoji(task.domain)}</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{task.name}</h3>
                <Badge className={`mt-2 ${getDomainColor(task.domain)}`}>
                  {task.domain.charAt(0).toUpperCase() + task.domain.slice(1)}
                </Badge>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {task.defaultPoints} pts
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-2">
              ⏱️ ~{task.estimatedMinutes} min
            </span>
            <span className="flex items-center gap-2">
              📅 {task.category}
            </span>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 space-y-3">
            <h4 className="font-semibold text-gray-900 text-center mb-4">
              How do you feel about this task?
            </h4>
            
            {isMobile ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    ➡️
                  </div>
                  <span>Swipe right = Love it</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    ⬅️
                  </div>
                  <span>Swipe left = Hate it</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    👆
                  </div>
                  <span>Tap = Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    ⬆️
                  </div>
                  <span>Swipe up = Haven't tried</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white rounded border">→</kbd>
                  <span>Love it</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white rounded border">←</kbd>
                  <span>Hate it</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white rounded border">Click</kbd>
                  <span>Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white rounded border">↑</kbd>
                  <span>Haven't tried</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SwipeCard;