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
  width: _width = 400,
  height: _height = 300,
  showBackground = true,
}: ParticlesAnimationProps) {
  // Адаптивные размеры для мобильных устройств
  // const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  // const isSmallMobile =
  //   typeof window !== "undefined" && window.innerWidth <= 480;

  // const adaptiveWidth = isSmallMobile
  //   ? width * 0.6
  //   : isMobile
  //     ? width * 0.8
  //     : width;
  // const adaptiveHeight = isSmallMobile
  //   ? height * 0.6
  //   : isMobile
  //     ? height * 0.8
  //     : height;
  return (
    <div className={`absolute inset-0 pointer-events-none z-10 ${className}`} style={{ zIndex: 10 }}>
      {showBackground && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-lg opacity-50" />
      )}
      <div className="relative w-full h-full">
        <div
          id="particles"
          className="particles-container"
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <div className="particle p1"></div>
          <div className="particle p2"></div>
          <div className="particle p3"></div>
          <div className="particle p4"></div>
          <div className="particle p5"></div>
          <div className="particle p6"></div>
          <div className="particle p7"></div>
          <div className="particle p8"></div>
          <div className="particle p9"></div>
          <div className="particle p10"></div>
          <div className="particle p11"></div>
          <div className="particle p12"></div>
          <div className="particle p13"></div>
          <div className="particle p14"></div>
          <div className="particle p15"></div>
          <div className="particle p16"></div>
          <div className="particle p17"></div>
          <div className="particle p18"></div>
          <div className="particle p19"></div>
          <div className="particle p20"></div>
        </div>
      </div>
    </div>
  );
}
