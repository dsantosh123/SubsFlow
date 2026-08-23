import { useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * TiltCard3D — A mouse-tracked 3D perspective card wrapper.
 *
 * Props:
 *   - children: React children rendered inside the card
 *   - className: Additional Tailwind/CSS classes for the card surface
 *   - glowColor: CSS color string for the border neon tint (default: cyber-indigo)
 *   - depth: Number of pixels for child translateZ depth (default: 0)
 *   - maxTilt: Maximum rotation in degrees (default: 12)
 *   - scale: Scale on hover (default: 1.02)
 *   - disabled: If true, disables tilt interaction
 */
export default function TiltCard3D({
  children,
  className = '',
  glowColor = 'rgba(99, 102, 241, 0.3)',
  depth = 0,
  maxTilt = 12,
  scale = 1.02,
  disabled = false,
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });
  const [specular, setSpecular] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback(
    (e) => {
      if (disabled || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized position from center: -1 to 1
      const normalX = (e.clientX - centerX) / (rect.width / 2);
      const normalY = (e.clientY - centerY) / (rect.height / 2);

      // Clamp values
      const clampedX = Math.max(-1, Math.min(1, normalX));
      const clampedY = Math.max(-1, Math.min(1, normalY));

      setTransform({
        rotateX: -clampedY * maxTilt,
        rotateY: clampedX * maxTilt,
        scale: scale,
      });

      // Specular highlight position (percentage-based)
      const specX = ((e.clientX - rect.left) / rect.width) * 100;
      const specY = ((e.clientY - rect.top) / rect.height) * 100;
      setSpecular({ x: specX, y: specY, opacity: 0.15 });
    },
    [disabled, maxTilt, scale]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    setSpecular((s) => ({ ...s, opacity: 0 }));
  }, []);

  const containerStyle = {
    perspective: '1200px',
    perspectiveOrigin: 'center center',
  };

  const cardStyle = {
    transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
    transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
    boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5), 
                0 0 0 1px ${glowColor},
                0 0 30px ${glowColor.replace(/[\d.]+\)$/, '0.1)')}`,
  };

  const specularStyle = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    background: `radial-gradient(circle at ${specular.x}% ${specular.y}%, rgba(255, 255, 255, ${specular.opacity}), transparent 60%)`,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
    zIndex: 10,
  };

  const depthWrapperStyle = depth > 0
    ? { transform: `translateZ(${depth}px)`, transformStyle: 'preserve-3d' }
    : {};

  return (
    <div style={containerStyle} className="w-full">
      <div
        ref={cardRef}
        className={twMerge(clsx('spatial-glass relative overflow-hidden w-full', className))}
        style={cardStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Specular highlight overlay */}
        <div style={specularStyle} />

        {/* Content with optional Z-depth */}
        <div style={depthWrapperStyle} className="relative z-[5] w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
