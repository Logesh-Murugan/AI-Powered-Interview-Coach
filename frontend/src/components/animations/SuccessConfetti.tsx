/**
 * SuccessConfetti Component
 * Celebration confetti animation
 */

import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface SuccessConfettiProps {
  show: boolean;
  duration?: number;
}

function SuccessConfetti({ show, duration = 3000 }: SuccessConfettiProps) {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => setIsActive(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!isActive) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.3}
    />
  );
}

export default SuccessConfetti;
