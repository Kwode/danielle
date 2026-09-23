import confetti from 'canvas-confetti';

const pinkPastels = ['#db2777', '#be185d', '#e11d48', '#9d174d', '#ec4899', '#f43f5e', '#f472b6', '#fb7185', '#fbbf24', '#ffffff'];

export const triggerCelebration = () => {
  // Center blast
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: pinkPastels,
    ticks: 200,
    scalar: 1.1,
  });

  // Left & right cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: pinkPastels,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: pinkPastels,
    });
  }, 180);
};

export const triggerHeartConfetti = () => {
  // Use shapes if possible or lovely soft spread
  const scalar = 2;
  const heart = confetti.shapeFromPath({
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  });

  confetti({
    shapes: [heart],
    scalar,
    particleCount: 35,
    spread: 80,
    origin: { y: 0.65 },
    colors: ['#be185d', '#db2777', '#e11d48', '#ec4899', '#9d174d'],
  });
};

export const triggerFireworks = () => {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: pinkPastels,
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: pinkPastels,
    });
  }, 300);
};

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
