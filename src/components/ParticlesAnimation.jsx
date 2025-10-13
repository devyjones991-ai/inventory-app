import PropTypes from "prop-types";
import React from "react";
import "../assets/particles-animation.css";

export default function ParticlesAnimation({
  className = "",
  width = 400,
  height = 300,
  showBackground = true,
}) {
  return (
    <div className={`relative ${className}`}>
      {showBackground && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-lg opacity-50" />
      )}

      <svg
        id="svg-global"
        width={width}
        height={height}
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Фоновые линии */}
        <g id="lines">
          <line
            id="line-v1"
            x1="50"
            y1="50"
            x2="50"
            y2="250"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
            className="text-blue-400 dark:text-blue-300"
          />
          <line
            id="line-v2"
            x1="350"
            y1="50"
            x2="350"
            y2="250"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
            className="text-purple-400 dark:text-purple-300"
          />
        </g>

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

        {/* Анимированные частицы */}
        <g id="particles">
          <circle
            className="particle p1"
            cx="80"
            cy="200"
            r="3"
            fill="currentColor"
            className="text-blue-500 dark:text-blue-400"
          />
          <circle
            className="particle p2"
            cx="120"
            cy="180"
            r="2"
            fill="currentColor"
            className="text-purple-500 dark:text-purple-400"
          />
          <circle
            className="particle p3"
            cx="160"
            cy="220"
            r="4"
            fill="currentColor"
            className="text-green-500 dark:text-green-400"
          />
          <circle
            className="particle p4"
            cx="200"
            cy="200"
            r="2"
            fill="currentColor"
            className="text-yellow-500 dark:text-yellow-400"
          />
          <circle
            className="particle p5"
            cx="240"
            cy="180"
            r="3"
            fill="currentColor"
            className="text-pink-500 dark:text-pink-400"
          />
          <circle
            className="particle p6"
            cx="280"
            cy="220"
            r="2"
            fill="currentColor"
            className="text-indigo-500 dark:text-indigo-400"
          />
          <circle
            className="particle p7"
            cx="320"
            cy="200"
            r="3"
            fill="currentColor"
            className="text-red-500 dark:text-red-400"
          />
          <circle
            className="particle p8"
            cx="90"
            cy="160"
            r="2"
            fill="currentColor"
            className="text-teal-500 dark:text-teal-400"
          />
          <circle
            className="particle p9"
            cx="310"
            cy="160"
            r="4"
            fill="currentColor"
            className="text-orange-500 dark:text-orange-400"
          />
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
