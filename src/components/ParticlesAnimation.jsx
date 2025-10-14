import PropTypes from "prop-types";
import React from "react";
import "../assets/particles-animation.css";

export default function ParticlesAnimation({
  className = "",
  width = 400,
  height = 300,
  showBackground = true,
}) {
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

      <svg
        id="svg-global"
        width={adaptiveWidth}
        height={adaptiveHeight}
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Фоновые линии - убраны для чистого дизайна */}

        {/* Центральная панель */}
        <rect
          id="panel-rigth"
          x="150"
          y="100"
          width="100"
          height="100"
          rx="10"
          fill="currentColor"
          opacity="0.1"
          className="text-indigo-500 dark:text-indigo-400"
        />

        {/* Серверный узел */}
        <circle
          id="node-server"
          cx="200"
          cy="150"
          r="15"
          fill="currentColor"
          className="text-green-500 dark:text-green-400"
        />

        {/* Рефлекторы */}
        <g id="reflectores">
          <circle
            cx="100"
            cy="120"
            r="8"
            fill="currentColor"
            opacity="0.6"
            className="text-yellow-400 dark:text-yellow-300"
          />
          <circle
            cx="300"
            cy="180"
            r="8"
            fill="currentColor"
            opacity="0.6"
            className="text-pink-400 dark:text-pink-300"
          />
        </g>

        {/* Анимированные элементы Multiminder */}
        <g id="particles">
          {/* Иконка задачи */}
          <g
            className="particle p1 text-blue-500 dark:text-blue-400"
            transform="translate(80, 200)"
          >
            <rect
              x="-8"
              y="-6"
              width="16"
              height="12"
              rx="2"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="-6"
              y="-4"
              width="12"
              height="8"
              rx="1"
              fill="white"
              opacity="0.9"
            />
            <circle cx="-2" cy="0" r="1" fill="currentColor" />
            <circle cx="2" cy="0" r="1" fill="currentColor" />
          </g>

          {/* Иконка документа */}
          <g
            className="particle p2 text-purple-500 dark:text-purple-400"
            transform="translate(120, 180)"
          >
            <path
              d="M-6,-8 L6,-8 L6,8 L-2,8 L-6,4 Z"
              fill="currentColor"
              opacity="0.8"
            />
            <path
              d="M-4,-6 L4,-6 L4,6 L-2,6 L-4,2 Z"
              fill="white"
              opacity="0.9"
            />
            <line
              x1="-2"
              y1="-2"
              x2="2"
              y2="-2"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <line
              x1="-2"
              y1="0"
              x2="2"
              y2="0"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <line
              x1="-2"
              y1="2"
              x2="1"
              y2="2"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </g>

          {/* Иконка уведомления */}
          <g
            className="particle p3 particle-glow text-green-500 dark:text-green-400"
            transform="translate(160, 220)"
          >
            <circle cx="0" cy="0" r="6" fill="currentColor" opacity="0.8" />
            <circle cx="0" cy="0" r="4" fill="white" opacity="0.9" />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontSize="8"
              fill="currentColor"
              fontWeight="bold"
            >
              !
            </text>
          </g>

          {/* Иконка чата */}
          <g
            className="particle p4 particle-sideways text-yellow-500 dark:text-yellow-400"
            transform="translate(200, 200)"
          >
            <path
              d="M-8,-6 Q-8,-8 0,-8 L6,-8 Q8,-8 8,-6 L8,2 Q8,4 6,4 L0,4 L-2,6 L-2,4 Q-8,4 -8,2 Z"
              fill="currentColor"
              opacity="0.8"
            />
            <circle cx="-3" cy="-2" r="1" fill="white" />
            <circle cx="0" cy="-2" r="1" fill="white" />
            <circle cx="3" cy="-2" r="1" fill="white" />
          </g>

          {/* Иконка оборудования */}
          <g
            className="particle p5 text-pink-500 dark:text-pink-400"
            transform="translate(240, 180)"
          >
            <rect
              x="-8"
              y="-4"
              width="16"
              height="8"
              rx="1"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="-6"
              y="-2"
              width="12"
              height="4"
              fill="white"
              opacity="0.9"
            />
            <circle cx="-4" cy="0" r="1" fill="currentColor" />
            <circle cx="0" cy="0" r="1" fill="currentColor" />
            <circle cx="4" cy="0" r="1" fill="currentColor" />
            <rect
              x="-2"
              y="-6"
              width="4"
              height="2"
              fill="currentColor"
              opacity="0.6"
            />
          </g>

          {/* Иконка пользователя */}
          <g
            className="particle p6 particle-glow text-indigo-500 dark:text-indigo-400"
            transform="translate(280, 220)"
          >
            <circle cx="0" cy="-2" r="4" fill="currentColor" opacity="0.8" />
            <path
              d="M-6,2 Q-6,6 0,6 Q6,6 6,2 L6,4 Q6,8 0,8 Q-6,8 -6,4 Z"
              fill="currentColor"
              opacity="0.8"
            />
            <circle cx="0" cy="-2" r="3" fill="white" opacity="0.9" />
            <path
              d="M-4,2 Q-4,5 0,5 Q4,5 4,2 L4,3 Q4,6 0,6 Q-4,6 -4,3 Z"
              fill="white"
              opacity="0.9"
            />
          </g>

          {/* Иконка списка */}
          <g
            className="particle p7 particle-sideways text-red-500 dark:text-red-400"
            transform="translate(320, 200)"
          >
            <rect
              x="-8"
              y="-8"
              width="16"
              height="16"
              rx="2"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="-6"
              y="-6"
              width="12"
              height="12"
              fill="white"
              opacity="0.9"
            />
            <line
              x1="-4"
              y1="-3"
              x2="4"
              y2="-3"
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1="-4"
              y1="0"
              x2="4"
              y2="0"
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1="-4"
              y1="3"
              x2="2"
              y2="3"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="-2" cy="-3" r="0.5" fill="currentColor" />
            <circle cx="-2" cy="0" r="0.5" fill="currentColor" />
            <circle cx="-2" cy="3" r="0.5" fill="currentColor" />
          </g>

          {/* Иконка настроек */}
          <g
            className="particle p8 text-teal-500 dark:text-teal-400"
            transform="translate(90, 160)"
          >
            <circle cx="0" cy="0" r="6" fill="currentColor" opacity="0.8" />
            <circle cx="0" cy="0" r="4" fill="white" opacity="0.9" />
            <circle cx="0" cy="0" r="2" fill="currentColor" opacity="0.6" />
            <circle cx="0" cy="0" r="1" fill="white" />
          </g>

          {/* Иконка папки */}
          <g
            className="particle p9 particle-glow text-orange-500 dark:text-orange-400"
            transform="translate(310, 160)"
          >
            <path
              d="M-8,-4 L-4,-6 L4,-6 L8,-4 L8,4 L-8,4 Z"
              fill="currentColor"
              opacity="0.8"
            />
            <path
              d="M-6,-4 L-2,-6 L4,-6 L6,-4 L6,2 L-6,2 Z"
              fill="white"
              opacity="0.9"
            />
            <rect
              x="-2"
              y="-2"
              width="4"
              height="2"
              fill="currentColor"
              opacity="0.6"
            />
          </g>

          {/* Дополнительные элементы */}
          <g
            className="particle p10 particle-sideways text-cyan-500 dark:text-cyan-400"
            transform="translate(60, 140)"
          >
            <rect
              x="-6"
              y="-6"
              width="12"
              height="12"
              rx="2"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="-4"
              y="-4"
              width="8"
              height="8"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M-2,-2 L2,2 M2,-2 L-2,2"
              stroke="currentColor"
              strokeWidth="1"
            />
          </g>

          <g
            className="particle p11 text-emerald-500 dark:text-emerald-400"
            transform="translate(340, 140)"
          >
            <circle cx="0" cy="0" r="5" fill="currentColor" opacity="0.8" />
            <circle cx="0" cy="0" r="3" fill="white" opacity="0.9" />
            <path
              d="M-1,-1 L1,1 M1,-1 L-1,1"
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </g>

          <g
            className="particle p12 particle-glow text-violet-500 dark:text-violet-400"
            transform="translate(180, 80)"
          >
            <rect
              x="-6"
              y="-4"
              width="12"
              height="8"
              rx="1"
              fill="currentColor"
              opacity="0.8"
            />
            <rect
              x="-4"
              y="-2"
              width="8"
              height="4"
              fill="white"
              opacity="0.9"
            />
            <circle cx="-2" cy="0" r="0.8" fill="currentColor" />
            <circle cx="2" cy="0" r="0.8" fill="currentColor" />
          </g>
        </g>
      </svg>
    </div>
  );
}

ParticlesAnimation.propTypes = {
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  showBackground: PropTypes.bool,
};
