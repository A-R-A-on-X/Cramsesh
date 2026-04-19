import React from 'react';

export default function AtomLogo({ size = 40, animated = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Nucleus */}
      <circle cx="40" cy="40" r="7" fill="url(#nucleusGrad)" />
      <circle cx="40" cy="40" r="4" fill="rgba(255,255,255,0.3)" />

      {/* Orbit 1 - tilted */}
      <ellipse
        cx="40" cy="40" rx="30" ry="10"
        stroke="url(#orbitGrad1)"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(-30 40 40)"
        opacity="0.8"
      />
      {/* Electron 1 */}
      <circle r="3.5" fill="#00d4ff">
        {animated && (
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href="#orbit1path" />
          </animateMotion>
        )}
        {!animated && <animate attributeName="cx" values="70;10;70" dur="2s" repeatCount="indefinite" />}
      </circle>

      {/* Orbit 2 - tilted other way */}
      <ellipse
        cx="40" cy="40" rx="30" ry="10"
        stroke="url(#orbitGrad2)"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(30 40 40)"
        opacity="0.8"
      />
      {/* Electron 2 */}
      <circle r="3" fill="#6c63ff">
        {animated && (
          <animateMotion dur="2.8s" repeatCount="indefinite" begin="-0.9s">
            <mpath href="#orbit2path" />
          </animateMotion>
        )}
      </circle>

      {/* Orbit 3 - vertical */}
      <ellipse
        cx="40" cy="40" rx="10" ry="30"
        stroke="url(#orbitGrad3)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      {/* Electron 3 */}
      <circle r="2.5" fill="#ff6b9d">
        {animated && (
          <animateMotion dur="1.6s" repeatCount="indefinite" begin="-0.4s">
            <mpath href="#orbit3path" />
          </animateMotion>
        )}
      </circle>

      {/* Hidden paths for animation */}
      <defs>
        <path id="orbit1path" d="M 70 40 A 30 10 0 1 1 69.99 40.01" transform="rotate(-30 40 40)" />
        <path id="orbit2path" d="M 70 40 A 30 10 0 1 1 69.99 40.01" transform="rotate(30 40 40)" />
        <path id="orbit3path" d="M 40 10 A 10 30 0 1 1 40.01 10.01" />

        <radialGradient id="nucleusGrad" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="50%" stopColor="#ff6b9d" />
          <stop offset="100%" stopColor="#6c63ff" />
        </radialGradient>
        <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="orbitGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#6c63ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#6c63ff" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="orbitGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff6b9d" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#ff6b9d" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff6b9d" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
