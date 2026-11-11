import React, { useState } from 'react'

interface CustomInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helperText?: string
  errorMessage?: string
  prefixNode?: React.ReactNode
  suffixNode?: React.ReactNode
  containerClassName?: string
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  helperText,
  errorMessage,
  prefixNode,
  suffixNode,
  containerClassName = '',
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-normal text-zinc-500 dark:text-zinc-400">
          <label className="cursor-pointer">{label}</label>
          {helperText && <span>{helperText}</span>}
        </div>
      )}

      <div
        className={`flex items-center px-4 py-2.5 rounded-[16px] transition-all cursor-text ${
          errorMessage
            ? 'bg-red-50/40 dark:bg-red-950/30'
            : isFocused
            ? 'bg-zinc-100 dark:bg-zinc-800'
            : 'bg-white dark:bg-zinc-950 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60'
        }`}
      >
        {prefixNode && (
          <div className="mr-3 text-zinc-400 dark:text-zinc-500 select-none flex items-center">
            {prefixNode}
          </div>
        )}

        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          className={`w-full bg-transparent font-normal text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none cursor-text ${className}`}
        />

        {suffixNode && (
          <div className="ml-3 text-zinc-500 dark:text-zinc-400 font-normal text-sm select-none">
            {suffixNode}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="text-xs text-red-600 dark:text-red-400 px-1 font-normal">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
