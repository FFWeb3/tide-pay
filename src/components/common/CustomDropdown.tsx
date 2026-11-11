import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconChevronDown } from '@tabler/icons-react'

export interface DropdownOption<T = string> {
  value: T
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

interface CustomDropdownProps<T = string> {
  label?: string
  options: DropdownOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  placeholder?: string
}

export function CustomDropdown<T = string>({
  label,
  options,
  value,
  onChange,
  className = '',
  placeholder = 'Select option',
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-normal text-zinc-500 dark:text-zinc-400 cursor-pointer">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer w-full bg-white dark:bg-zinc-950 hover:bg-zinc-100/70 dark:hover:bg-zinc-800 px-4 py-2.5 rounded-[16px] flex items-center justify-between text-left transition-all text-black dark:text-white"
      >
        <div className="flex items-center gap-3">
          {selectedOption?.icon}
          <div>
            <div className="text-sm font-normal text-black dark:text-white">
              {selectedOption ? selectedOption.label : placeholder}
            </div>
            {selectedOption?.sublabel && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                {selectedOption.sublabel}
              </div>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-zinc-400 dark:text-zinc-500"
        >
          <IconChevronDown size={16} stroke={1.75} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 z-40 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-[16px] overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {options.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                    }}
                    className={`cursor-pointer w-full text-left px-3 py-2 rounded-[12px] transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {opt.icon}
                      <div>
                        <div className="text-sm font-normal">{opt.label}</div>
                        {opt.sublabel && (
                          <div
                            className={`text-xs ${
                              isSelected
                                ? 'text-zinc-300 dark:text-zinc-600'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
