import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
}

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const Confetti = ({ isActive, onComplete }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const colors = [
        "hsl(333, 71%, 50%)",
        "hsl(262, 100%, 64%)",
        "hsl(45, 100%, 60%)",
        "hsl(142, 76%, 36%)",
        "hsl(320, 100%, 70%)",
        "hsl(217, 91%, 60%)",
      ];

      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }));

      setPieces(newPieces);

      const timeout = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isActive, onComplete]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm animate-confetti"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};
