import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const PixelHandCursor: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => (
  <svg
    width={size}
    height={(size * 17) / 16}
    viewBox="0 0 16 17"
    fill="none"
    className={`select-none pointer-events-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      d="M6,0h1v1h-1zM7,0h1v1h-1zM5,1h1v1h-1zM8,1h1v1h-1zM5,2h1v1h-1zM8,2h1v1h-1zM5,3h1v1h-1zM8,3h1v1h-1zM5,4h1v1h-1zM8,4h1v1h-1zM5,5h1v1h-1zM8,5h1v1h-1zM9,5h1v1h-1zM10,5h1v1h-1zM11,5h1v1h-1zM5,6h1v1h-1zM8,6h1v1h-1zM11,6h1v1h-1zM2,7h1v1h-1zM3,7h1v1h-1zM4,7h1v1h-1zM5,7h1v1h-1zM8,7h1v1h-1zM11,7h1v1h-1zM12,7h1v1h-1zM13,7h1v1h-1zM14,7h1v1h-1zM1,8h1v1h-1zM4,8h1v1h-1zM5,8h1v1h-1zM8,8h1v1h-1zM11,8h1v1h-1zM14,8h1v1h-1zM0,9h1v1h-1zM4,9h1v1h-1zM5,9h1v1h-1zM8,9h1v1h-1zM11,9h1v1h-1zM14,9h1v1h-1zM0,10h1v1h-1zM5,10h1v1h-1zM14,10h1v1h-1zM1,11h1v1h-1zM14,11h1v1h-1zM2,12h1v1h-1zM14,12h1v1h-1zM2,13h1v1h-1zM13,13h1v1h-1zM3,14h1v1h-1zM12,14h1v1h-1zM3,15h1v1h-1zM12,15h1v1h-1zM4,16h1v1h-1zM5,16h1v1h-1zM6,16h1v1h-1zM7,16h1v1h-1zM8,16h1v1h-1zM9,16h1v1h-1zM10,16h1v1h-1zM11,16h1v1h-1z"
      fill="#141c18"
    />
    <path
      d="M6,1h1v1h-1zM7,1h1v1h-1zM6,2h1v1h-1zM7,2h1v1h-1zM6,3h1v1h-1zM7,3h1v1h-1zM6,4h1v1h-1zM7,4h1v1h-1zM6,5h1v1h-1zM7,5h1v1h-1zM6,6h1v1h-1zM7,6h1v1h-1zM9,6h1v1h-1zM10,6h1v1h-1zM6,7h1v1h-1zM7,7h1v1h-1zM9,7h1v1h-1zM10,7h1v1h-1zM2,8h1v1h-1zM3,8h1v1h-1zM6,8h1v1h-1zM7,8h1v1h-1zM9,8h1v1h-1zM10,8h1v1h-1zM12,8h1v1h-1zM13,8h1v1h-1zM1,9h1v1h-1zM2,9h1v1h-1zM3,9h1v1h-1zM6,9h1v1h-1zM7,9h1v1h-1zM9,9h1v1h-1zM10,9h1v1h-1zM12,9h1v1h-1zM13,9h1v1h-1zM1,10h1v1h-1zM2,10h1v1h-1zM3,10h1v1h-1zM4,10h1v1h-1zM6,10h1v1h-1zM7,10h1v1h-1zM8,10h1v1h-1zM9,10h1v1h-1zM10,10h1v1h-1zM11,10h1v1h-1zM12,10h1v1h-1zM13,10h1v1h-1zM2,11h1v1h-1zM3,11h1v1h-1zM4,11h1v1h-1zM5,11h1v1h-1zM6,11h1v1h-1zM7,11h1v1h-1zM8,11h1v1h-1zM9,11h1v1h-1zM10,11h1v1h-1zM11,11h1v1h-1zM12,11h1v1h-1zM13,11h1v1h-1zM3,12h1v1h-1zM4,12h1v1h-1zM5,12h1v1h-1zM6,12h1v1h-1zM7,12h1v1h-1zM8,12h1v1h-1zM9,12h1v1h-1zM10,12h1v1h-1zM11,12h1v1h-1zM12,12h1v1h-1zM13,12h1v1h-1zM3,13h1v1h-1zM4,13h1v1h-1zM5,13h1v1h-1zM6,13h1v1h-1zM7,13h1v1h-1zM8,13h1v1h-1zM9,13h1v1h-1zM10,13h1v1h-1zM11,13h1v1h-1zM12,13h1v1h-1zM4,14h1v1h-1zM5,14h1v1h-1zM6,14h1v1h-1zM7,14h1v1h-1zM8,14h1v1h-1zM9,14h1v1h-1zM10,14h1v1h-1zM11,14h1v1h-1zM4,15h1v1h-1zM5,15h1v1h-1zM6,15h1v1h-1zM7,15h1v1h-1zM8,15h1v1h-1zM9,15h1v1h-1zM10,15h1v1h-1zM11,15h1v1h-1z"
      fill="#ffffff"
    />
  </svg>
)

interface HeadlineVariant {
  prefix: string
  pill: string
  suffix: string
}

const VARIANTS: HeadlineVariant[] = [
  { prefix: 'Find', pill: 'real yield', suffix: 'everywhere.' },
  { prefix: 'Put', pill: 'idle crypto', suffix: 'to work.' },
  { prefix: 'Earn', pill: 'clean returns', suffix: 'everywhere.' },
  { prefix: 'Find', pill: 'Proof of Stake', suffix: 'everywhere.' },
]

export const InteractivePillHeadline: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [index, setIndex] = useState(0)
  const [isInteracting, setIsInteracting] = useState(false)
  const current = VARIANTS[index]

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % VARIANTS.length)
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <h1 className="text-3xl min-[400px]:text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] leading-[115%] sm:leading-[110%] text-black dark:text-white flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3.5 gap-y-2 py-1">
        {/* Dynamic Prefix */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`prefix-${current.prefix}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="inline-block"
          >
            {current.prefix}
          </motion.span>
        </AnimatePresence>

        {/* Interactive Floating Pill Badge with Hand Cursor */}
        <motion.div
          drag
          dragConstraints={{ left: -36, right: 36, top: -20, bottom: 20 }}
          dragElastic={0.25}
          whileDrag={{ scale: 1.08, rotate: -2, cursor: 'grabbing' }}
          whileHover={{ scale: 1.04, rotate: -4 }}
          whileTap={{ scale: 0.96 }}
          animate={{ rotate: -6.5 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          onClick={handleNext}
          onHoverStart={() => setIsInteracting(true)}
          onHoverEnd={() => setIsInteracting(false)}
          className="relative inline-flex items-center cursor-grab active:cursor-grabbing group mx-1 sm:mx-2"
          title="Click to cycle statement, drag to play"
        >
          {/* Main Capsule Body */}
          <div className="relative inline-flex items-center px-4 sm:px-6 py-1 sm:py-2 rounded-full bg-[#d6e8dc] text-[#173826]">
            {/* Pill Word with AnimatePresence */}
            <AnimatePresence mode="wait">
              <motion.span
                key={`pill-${current.pill}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="font-normal tracking-tight text-xl min-[400px]:text-2xl sm:text-4xl md:text-5xl lowercase whitespace-nowrap"
              >
                {current.pill}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Retro Pixel Hand Cursor Touching the Pill */}
          <motion.div
            animate={{
              y: isInteracting ? 2 : [0, -2, 0],
            }}
            transition={{
              repeat: isInteracting ? 0 : Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
            className="absolute -bottom-4 sm:-bottom-5 left-[42%] pointer-events-none z-30 transition-transform duration-200 group-hover:scale-110"
          >
            <PixelHandCursor size={26} />
          </motion.div>
        </motion.div>

        {/* Dynamic Suffix */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`suffix-${current.suffix}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="inline-block"
          >
            {current.suffix}
          </motion.span>
        </AnimatePresence>
      </h1>

      {/* Subtle Micro Interaction Hint */}
      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-mono mt-1 opacity-70 hover:opacity-100 transition-opacity">
        <span>tap to cycle or drag to play</span>
      </div>
    </div>
  )
}

