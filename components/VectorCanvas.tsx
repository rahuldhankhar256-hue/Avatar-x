
import React, { useEffect, useRef } from 'react';
import { GameState } from '../types';

interface VectorCanvasProps {
  multiplier: number;
  gameState: GameState;
}

const VectorCanvas: React.FC<VectorCanvasProps> = ({ multiplier, gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const padding = 50;

      // Draw Grid
      ctx.strokeStyle = '#1e2329';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (height / 10) * i);
        ctx.lineTo(width, (height / 10) * i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((width / 10) * i, 0);
        ctx.lineTo((width / 10) * i, height);
        ctx.stroke();
      }

      if (gameState === GameState.FLYING || gameState === GameState.CRASHED) {
        // Draw the curve
        const curveProgress = Math.min(1, (multiplier - 1) / 10);
        const endX = padding + (width - padding * 2) * curveProgress;
        const endY = height - padding - (height - padding * 2) * Math.pow(curveProgress, 1.5);

        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        
        // Quad curve for smooth path
        const cpX = padding + (endX - padding) / 2;
        const cpY = height - padding;
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        
        ctx.strokeStyle = gameState === GameState.CRASHED ? '#ff3b30' : '#f0b90b';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw Glow
        if (gameState !== GameState.CRASHED) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#f0b90b';
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Draw Vector Icon (Rocket/Plane)
        ctx.fillStyle = gameState === GameState.CRASHED ? '#ff3b30' : '#f0b90b';
        ctx.beginPath();
        ctx.arc(endX, endY, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [multiplier, gameState]);

  return (
    <div className="relative w-full h-full bg-[#161a1e] rounded-xl overflow-hidden border border-gray-800">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full"
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {gameState === GameState.WAITING && (
          <div className="text-gray-400 font-orbitron text-xl animate-pulse">WAITING FOR NEXT ROUND...</div>
        )}
        {gameState === GameState.STARTING && (
          <div className="text-yellow-500 font-orbitron text-4xl animate-bounce">READY!</div>
        )}
        {(gameState === GameState.FLYING || gameState === GameState.CRASHED) && (
          <div className={`font-orbitron text-6xl md:text-8xl transition-colors duration-300 ${gameState === GameState.CRASHED ? 'text-red-500' : 'text-white'}`}>
            {multiplier.toFixed(2)}x
          </div>
        )}
        {gameState === GameState.CRASHED && (
          <div className="text-red-500 font-orbitron text-2xl mt-4 bg-red-500/10 px-6 py-2 rounded-full border border-red-500/50">
            CRASHED!
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorCanvas;
