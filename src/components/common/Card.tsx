import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-50 dark:bg-zinc-900 rounded-[18px] p-5 md:p-6 transition-all ${
        onClick ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
