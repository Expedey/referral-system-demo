import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  animationType: string;
}

interface ConfettiProps {
  isActive: boolean;
}

const Confetti: React.FC<ConfettiProps> = ({ isActive }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      // Create confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // 0-100% of container width
        y: -10, // Start above the container
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5, // 0.5 to 1
        color: [
          '#FF6B6B', // Red
          '#4ECDC4', // Teal
          '#45B7D1', // Blue
          '#96CEB4', // Green
          '#FFEAA7', // Yellow
          '#DDA0DD', // Plum
          '#98D8C8', // Mint
          '#F7DC6F', // Gold
          '#BB8FCE', // Purple
          '#85C1E9', // Light Blue
          '#FF9FF3', // Pink
          '#54A0FF', // Sky Blue
        ][Math.floor(Math.random() * 12)],
        delay: Math.random() * 1, // 0-1s delay
        animationType: ['confetti-fall', 'confetti-fall-2', 'confetti-fall-3'][Math.floor(Math.random() * 3)],
      }));

      setPieces(newPieces);

      // Clear confetti after animation
      const timer = setTimeout(() => {
        setPieces([]);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999]">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute ${piece.animationType}`}
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animationDelay: `${piece.delay}s`,
          }}
        >
          <div 
            className="w-2 h-2"
            style={{
              background: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
              boxShadow: `0 0 4px ${piece.color}40`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default Confetti; 