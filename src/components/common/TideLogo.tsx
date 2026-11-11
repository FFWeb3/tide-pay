import React from 'react'

interface TideLogoProps {
  size?: number
  className?: string
  mode?: 'light' | 'dark' | 'auto'
}

export const TideLogo: React.FC<TideLogoProps> = ({
  size = 24,
  className = '',
  mode = 'auto',
}) => {
  const fillColor =
    mode === 'light'
      ? '#09090b'
      : mode === 'dark'
      ? '#ffffff'
      : 'currentColor'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`select-none shrink-0 ${className}`}
      aria-label="Tide Logo"
    >
      {/* Shadow / reflection pixels */}
      <rect x="8" y="16" width="4" height="4" fill={fillColor} opacity={0.35} />
      <rect x="12" y="12" width="4" height="4" fill={fillColor} opacity={0.35} />
      <rect x="8" y="20" width="4" height="4" fill={fillColor} opacity={0.35} />

      {/* Main crest pixels */}
      <rect x="4" y="16" width="4" height="4" fill={fillColor} />
      <rect x="8" y="12" width="4" height="4" fill={fillColor} />
      <rect x="12" y="8" width="4" height="4" fill={fillColor} />
      <rect x="16" y="4" width="4" height="4" fill={fillColor} />
      <rect x="20" y="4" width="4" height="4" fill={fillColor} />
      <rect x="20" y="8" width="4" height="4" fill={fillColor} />
      <rect x="16" y="12" width="4" height="4" fill={fillColor} />
    </svg>
  )
}

