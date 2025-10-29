import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationAnimationProps {
  show: boolean;
  onComplete: () => void;
}

const CelebrationAnimation = ({ show, onComplete }: CelebrationAnimationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'][Math.floor(Math.random() * 7)],
        size: Math.random() * 10 + 5,
      }));
      setParticles(newParticles);

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Magical creature (platypus instead of unicorn) */}
          <motion.div
            initial={{ x: -200, y: window.innerHeight / 2 }}
            animate={{ 
              x: window.innerWidth + 200,
              y: [
                window.innerHeight / 2,
                window.innerHeight / 2 - 100,
                window.innerHeight / 2 - 50,
                window.innerHeight / 2 - 150,
                window.innerHeight / 2
              ]
            }}
            transition={{ 
              duration: 3,
              ease: "easeInOut",
              y: {
                duration: 3,
                repeat: 0,
                ease: "easeInOut"
              }
            }}
            className="absolute"
          >
            <div className="relative">
              {/* Rainbow trail */}
              <motion.div
                className="absolute -left-40 top-1/2 -translate-y-1/2 w-96 h-32"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,107,107,0) 0%, rgba(255,107,107,0.8) 20%, rgba(78,205,196,0.8) 40%, rgba(69,183,209,0.8) 60%, rgba(255,160,122,0.8) 80%, rgba(152,216,200,0) 100%)',
                  filter: 'blur(20px)',
                  borderRadius: '50%',
                }}
                animate={{
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Platypus emoji */}
              <motion.div
                className="text-8xl"
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🦆
              </motion.div>
            </div>
          </motion.div>

          {/* Confetti particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: particle.x, 
                y: particle.y,
                opacity: 1,
                rotate: 0,
              }}
              animate={{ 
                y: window.innerHeight + 100,
                x: particle.x + (Math.random() - 0.5) * 200,
                opacity: [1, 1, 0],
                rotate: Math.random() * 720,
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                ease: "easeIn",
              }}
              style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%',
              }}
            />
          ))}

          {/* Success message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: 2,
                }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Amazing Work!
              </h2>
              <p className="text-lg text-gray-600">
                You completed a complex task!
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationAnimation;