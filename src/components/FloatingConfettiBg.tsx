import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'heart';
}

const CONFETTI_COLORS = [
  '#be185d', // deep raspberry / dark pink
  '#9d174d', // deep rose wine
  '#831843', // deep magenta rose
  '#db2777', // rich dark pink
  '#e11d48', // rose-600
  '#c026d3', // deep fuchsia
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#f59e0b', // warm gold
  '#ffffff', // sparkling white
];

export const FloatingConfettiBg: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create 45 lightweight floating confetti particles
    const count = Math.min(Math.floor(width / 28), 50);
    const particles: Particle[] = [];

    const shapes: ('rect' | 'circle' | 'heart')[] = ['rect', 'circle', 'heart', 'rect'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: Math.random() * 0.8 + 0.4, // gentle drifting downward
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.5,
        opacity: Math.random() * 0.6 + 0.25,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const topCurveHeight = size * 0.3;
      c.beginPath();
      c.moveTo(x, y + topCurveHeight);
      c.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
      c.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
      c.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
      c.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
      c.closePath();
      c.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        // Wrap around seamlessly
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'heart') {
          drawHeart(ctx, -p.size * 0.25, -p.size * 0.35, p.size * 0.7);
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Darker, richer blush gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/90 via-rose-200/80 to-pink-300/85" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/25 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-rose-500/25 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-pink-400/25 rounded-full blur-3xl" />

      {/* Floating Canvas Confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
