import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeRating } from '@/types/onboarding';

interface CelebrationAnimationProps {
  rating: SwipeRating | null;
  onComplete: () => void;
}

const CelebrationAnimation = ({ rating, onComplete }: CelebrationAnimationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);

  useEffect(() => {
    if (!rating) return;

    let emoji = '✨';
    let count = 0;

    switch (rating) {
      case 'love':
        emoji = '❤️';
        count = 20;
        break;
      case 'untried':
        emoji = '✨';
        count = 15;
        break;
      case 'neutral':
        emoji = '👍';
        count = 10;
        break;
      case 'hate':
        emoji = '💔';
        count = 8;
        break;
    }

    // Generate random particles
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      emoji,
    }));

    setParticles(newParticles);

    // Clear after animation
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [rating, onComplete]);

  if (!rating) return null;

  const getMessage = () => {
    switch (rating) {
      case 'love':
        return { text: 'Love it! 💖', color: 'text-pink-600' };
      case 'hate':
        return { text: 'Got it! 👍', color: 'text-blue-600' };
      case 'neutral':
        return { text: 'Noted! ✓', color: 'text-gray-600' };
      case 'untried':
        return { text: 'Try it sometime! ✨', color: 'text-purple-600' };
    }
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {rating && (
        <>
          {/* Center Message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className={`text-6xl font-bold ${message.color} drop-shadow-lg`}>
              {message.text}
            </div>
          </motion.div>

          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: particle.x,
                y: particle.y,
                scale: [0, 1.5, 1],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
              className="fixed text-4xl pointer-events-none z-50"
              style={{ left: 0, top: 0 }}
            >
              {particle.emoji}
            </motion.div>
          ))}

          {/* Special confetti for "love" rating */}
          {rating === 'love' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-40"
            >
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0,
                  }}
                  animate={{
                    y: window.innerHeight + 20,
                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    ease: 'linear',
                    delay: Math.random() * 0.5,
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][
                      Math.floor(Math.random() * 5)
                    ],
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Hearts animation for "untried" to encourage trying */}
          {rating === 'untried' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-40"
            >
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={`heart-${i}`}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: window.innerHeight + 20,
                    scale: 0,
                  }}
                  animate={{
                    y: -20,
                    scale: [0, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    ease: 'easeOut',
                    delay: Math.random() * 0.3,
                  }}
                  className="absolute text-3xl"
                >
                  💫
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default CelebrationAnimation;