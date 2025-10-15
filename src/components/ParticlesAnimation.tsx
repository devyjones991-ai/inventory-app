import React from "react";
import "../assets/particles-animation.css";

interface ParticlesAnimationProps {
  className?: string;
  width?: number;
  height?: number;
  showBackground?: boolean;
}

export default function ParticlesAnimation({
  className = "",
  width = 400,
  height = 300,
  showBackground = true,
}: ParticlesAnimationProps) {
  // Адаптивные размеры для мобильных устройств
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  const isSmallMobile =
    typeof window !== "undefined" && window.innerWidth <= 480;

  const adaptiveWidth = isSmallMobile
    ? width * 0.6
    : isMobile
      ? width * 0.8
      : width;
  const adaptiveHeight = isSmallMobile
    ? height * 0.6
    : isMobile
      ? height * 0.8
      : height;
  return (
    <div className={`absolute inset-0 pointer-events-none z-10 ${className}`}>
      {showBackground && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-lg opacity-50" />
      )}
      <div className="relative w-full h-full">
        <div
          className="particles-container"
          style={{
            width: `${adaptiveWidth}px`,
            height: `${adaptiveHeight}px`,
          }}
        >
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
          <div className="particle particle-7"></div>
          <div className="particle particle-8"></div>
          <div className="particle particle-9"></div>
          <div className="particle particle-10"></div>
          <div className="particle particle-11"></div>
          <div className="particle particle-12"></div>
          <div className="particle particle-13"></div>
          <div className="particle particle-14"></div>
          <div className="particle particle-15"></div>
          <div className="particle particle-16"></div>
          <div className="particle particle-17"></div>
          <div className="particle particle-18"></div>
          <div className="particle particle-19"></div>
          <div className="particle particle-20"></div>
        </div>
      </div>
    </div>
  );
}
