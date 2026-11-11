import React from 'react'

export interface LogoProps {
  size?: number
  className?: string
  strokeWidth?: number
}

// Option 1: Dual Harmonic Waves (Liquidity flow & return)
export const LogoHarmonicWave: React.FC<LogoProps> = ({
  size = 24,
  className = '',
  strokeWidth = 2.5,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7 27C15 27 17 15 27 15C34 15 37 23 42 23"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 33C15 33 17 21 27 21C34 21 37 29 42 29"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.45"
    />
  </svg>
)

// Option 2: The 'T' Crest (Monogram + Tidal wave)
export const LogoTCrest: React.FC<LogoProps> = ({
  size = 24,
  className = '',
  strokeWidth = 2.75,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 16H36C36 16 38.5 24 32.5 26C27 27.5 24 23 24 16V36"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Option 3: Dual Currents Loop (Nimiq Proof of Stake + Polygon USDT)
export const LogoDualCurrents: React.FC<LogoProps> = ({
  size = 24,
  className = '',
  strokeWidth = 2.5,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M13 22C13 14.82 18.82 9 26 9C32.5 9 37.5 14 37 20C36.5 26.5 28.5 32 24 37C19.5 32 11.5 26.5 11 20"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M19 23C19 18 22 15 26 15C29.5 15 32 17.5 32 21C32 25.5 27 29 24 31.5"
      stroke="currentColor"
      strokeWidth={strokeWidth * 0.9}
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
)

// Option 4: Pure Geometric Wave Crest (Swiss / Minimalist loop)
export const LogoMinimalWave: React.FC<LogoProps> = ({
  size = 24,
  className = '',
  strokeWidth = 2.75,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8 30C12 30 14 24 18.5 18C23.5 11 31.5 11 36 15.5C40 19.5 38.5 27 32 27C26.5 27 26 21 30 19"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Option 5: Eclipse Tide (Gravitational lunar pull)
export const LogoEclipseTide: React.FC<LogoProps> = ({
  size = 24,
  className = '',
  strokeWidth = 2.4,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle
      cx="24"
      cy="24"
      r="17"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    />
    <path
      d="M12 28C17 28 19 18.5 25 18.5C30 18.5 32 24.5 36 24.5"
      stroke="currentColor"
      strokeWidth={strokeWidth * 1.15}
      strokeLinecap="round"
    />
  </svg>
)

// Option 6: Pixel Wave (Matches landing page 8-bit accents)
export const LogoPixelWave: React.FC<LogoProps> = ({
  size = 24,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    shapeRendering="crispEdges"
  >
    <rect x="8" y="28" width="6" height="6" fill="currentColor" />
    <rect x="14" y="23" width="6" height="6" fill="currentColor" />
    <rect x="20" y="17" width="6" height="6" fill="currentColor" />
    <rect x="26" y="13" width="6" height="6" fill="currentColor" />
    <rect x="32" y="13" width="6" height="6" fill="currentColor" />
    <rect x="32" y="19" width="6" height="6" fill="currentColor" />
    <rect x="26" y="24" width="6" height="6" fill="currentColor" />
    <rect x="14" y="32" width="6" height="6" fill="currentColor" opacity="0.35" />
    <rect x="20" y="27" width="6" height="6" fill="currentColor" opacity="0.35" />
  </svg>
)

export const TIDE_LOGOS = [
  {
    id: 'harmonic-wave',
    name: 'Dual Harmonic Waves',
    description: 'Parallel tidal streams representing continuous, compounding yield flow.',
    Component: LogoHarmonicWave,
  },
  {
    id: 't-crest',
    name: 'The T-Crest',
    description: 'Bold monogram T whose crossbar curls into a cresting ocean wave.',
    Component: LogoTCrest,
  },
  {
    id: 'dual-currents',
    name: 'Dual Currents Loop',
    description: 'Interlocking tidal currents uniting native NIM staking and Polygon USDT lending.',
    Component: LogoDualCurrents,
  },
  {
    id: 'minimal-wave',
    name: 'Minimalist Waveform',
    description: 'Pure geometric bezier wave with a fluid rising crest in Swiss aesthetic.',
    Component: LogoMinimalWave,
  },
  {
    id: 'eclipse-tide',
    name: 'Eclipse Tide',
    description: 'Enclosed circular boundary with a gravitational wave crest.',
    Component: LogoEclipseTide,
  },
  {
    id: 'pixel-wave',
    name: 'Pixel Crest',
    description: 'Retro 8-bit wave crest harmonizing with the landing page pixel clusters.',
    Component: LogoPixelWave,
  },
]

