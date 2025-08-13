import { useEffect, useRef } from 'react';

const BubbleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Bubble {
      constructor(x, y, dx, dy, radius, color) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.color = color;
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update(ctx) {
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) this.dx = -this.dx;
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) this.dy = -this.dy;

        this.x += this.dx;
        this.y += this.dy;

        this.draw(ctx);
      }
    }

    const bubbles = [];
    const colors = ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.3)'];
    const bubbleCount = 40;

    for (let i = 0; i < bubbleCount; i++) {
      const radius = Math.random() * 20 + 10;
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = Math.random() * (canvas.height - radius * 2) + radius;
      const dx = (Math.random() - 0.5) * 1.5;
      const dy = (Math.random() - 0.5) * 1.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      bubbles.push(new Bubble(x, y, dx, dy, radius, color));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bubbles.forEach(bubble => bubble.update(ctx));
      requestAnimationFrame(animate);
    };

    animate();

    const resizeHandler = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#5e68f2',
      }}
    />
  );
};

export default BubbleBackground;
