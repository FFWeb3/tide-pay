import React, { useEffect, useState } from 'react'
import { TideLogo } from '../common/TideLogo'
import { fetchOnChainAaveRate, fetchLiveValidatorPools } from '../../services/ratesService'

// Helper to render crisp pixel cluster
const PixelCluster: React.FC<{
  matrix: number[][]
  color: string
  pixelSize?: number
  className?: string
}> = ({ matrix, color, pixelSize = 6, className = '' }) => {
  const rows = matrix.length
  const cols = matrix[0].length
  const width = cols * pixelSize
  const height = rows * pixelSize

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`select-none pointer-events-none ${className}`}
      shapeRendering="crispEdges"
    >
      {matrix.map((row, rIdx) =>
        row.map((val, cIdx) => {
          if (!val) return null
          return (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * pixelSize}
              y={rIdx * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          )
        })
      )}
    </svg>
  )
}

// 5 pixel clusters matching the reference image
const ORANGE_PIXELS = [
  [1, 1, 0, 1],
  [0, 1, 1, 1],
  [1, 1, 1, 0],
  [1, 0, 1, 1],
]

const CYAN_PIXELS = [
  [1, 1, 0],
  [1, 0, 0],
  [0, 0, 0],
  [0, 1, 0],
]

const YELLOW_PIXELS = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
]

const MINT_PIXELS = [
  [0, 1, 0],
  [1, 1, 1],
  [1, 0, 1],
]

const PINK_PIXELS = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
]

export const LandingGraphic: React.FC = () => {
  const [liveAaveApy, setLiveAaveApy] = useState<number | null>(null)
  const [liveNimApy, setLiveNimApy] = useState<number | null>(null)

  useEffect(() => {
    fetchOnChainAaveRate().then((rate) => {
      if (rate !== null) setLiveAaveApy(rate)
    })
    fetchLiveValidatorPools().then((pools) => {
      if (pools.length > 0) {
        const avg = pools.reduce((acc, p) => acc + p.rewardRatePercent, 0) / pools.length
        setLiveNimApy(Number(avg.toFixed(2)))
      }
    })
  }, [])

  return (
    <div className="relative w-[300px] min-[400px]:w-[360px] sm:w-[440px] md:w-[500px] h-[200px] min-[400px]:h-[230px] sm:h-[260px] md:h-[280px] flex items-center justify-center select-none">
      {/* 5 Colorful Pixel Clusters in an arc above the cards */}
      <div className="absolute left-[2%] sm:left-[6%] top-[24%] sm:top-[28%] z-20">
        <PixelCluster matrix={ORANGE_PIXELS} color="#f97316" pixelSize={6} />
      </div>

      <div className="absolute left-[20%] sm:left-[24%] top-[6%] sm:top-[10%] z-20">
        <PixelCluster matrix={CYAN_PIXELS} color="#38bdf8" pixelSize={6} />
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-[0%] sm:top-[2%] z-20">
        <PixelCluster matrix={YELLOW_PIXELS} color="#facc15" pixelSize={6} />
      </div>

      <div className="absolute right-[20%] sm:right-[24%] top-[6%] sm:top-[10%] z-20">
        <PixelCluster matrix={MINT_PIXELS} color="#34d399" pixelSize={6} />
      </div>

      <div className="absolute right-[2%] sm:right-[6%] top-[24%] sm:top-[28%] z-20">
        <PixelCluster matrix={PINK_PIXELS} color="#ec4899" pixelSize={6} />
      </div>

      {/* Card 1 (Back Left, tilted counter-clockwise) */}
      <div
        className="absolute left-[8px] min-[400px]:left-[16px] sm:left-[25px] top-[32px] sm:top-[42px] w-[190px] min-[400px]:w-[230px] sm:w-[270px] md:w-[310px] h-[125px] min-[400px]:h-[145px] sm:h-[165px] md:h-[185px] rounded-[16px] sm:rounded-[18px] bg-[#17171a] -rotate-[7deg] p-3 sm:p-4.5 flex flex-col justify-between transition-transform duration-300 hover:-rotate-[5deg]"
      >
        <div className="flex items-center gap-1.5 pb-1.5 sm:pb-2">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-600/80" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-600/80" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-600/80" />
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <div className="text-[10px] sm:text-xs text-zinc-400 font-normal">NIM Proof of Stake</div>
          <div className="text-base min-[400px]:text-lg sm:text-2xl font-normal text-emerald-400 tracking-tight">
            {liveNimApy !== null ? `~${liveNimApy.toFixed(2)}% APY` : 'Live PoS APY'}
          </div>
          <div className="text-[9px] sm:text-xs text-zinc-500 font-normal">
            Delegated directly in Nimiq Pay
          </div>
        </div>
      </div>

      {/* Card 2 (Back Right, tilted clockwise) */}
      <div
        className="absolute right-[8px] min-[400px]:right-[16px] sm:right-[25px] top-[26px] sm:top-[34px] w-[190px] min-[400px]:w-[230px] sm:w-[270px] md:w-[310px] h-[125px] min-[400px]:h-[145px] sm:h-[165px] md:h-[185px] rounded-[16px] sm:rounded-[18px] bg-[#141417] rotate-[5deg] p-3 sm:p-4.5 flex flex-col justify-between transition-transform duration-300 hover:rotate-[3deg]"
      >
        <div className="flex items-center gap-1.5 pb-1.5 sm:pb-2">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-600/80" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-600/80" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-600/80" />
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <div className="text-[10px] sm:text-xs text-zinc-400 font-normal">USDT Lending Market</div>
          <div className="text-base min-[400px]:text-lg sm:text-2xl font-normal text-zinc-200 tracking-tight">
            {liveAaveApy !== null ? `~${liveAaveApy.toFixed(2)}% Net APY` : 'Live Net APY'}
          </div>
          <div className="text-[9px] sm:text-xs text-zinc-500 font-normal">
            Aave V3 Polygon with gas deduction
          </div>
        </div>
      </div>

      {/* Card 3 (Front Center, dominant) */}
      <div
        className="absolute top-[46px] min-[400px]:top-[54px] sm:top-[65px] z-10 w-[215px] min-[400px]:w-[255px] sm:w-[300px] md:w-[340px] h-[135px] min-[400px]:h-[155px] sm:h-[175px] md:h-[195px] rounded-[18px] sm:rounded-[20px] bg-[#1f1f23] -rotate-[1deg] p-3.5 sm:p-5 flex flex-col justify-between transition-transform duration-300 hover:rotate-0"
      >
        <div className="flex items-center gap-1.5 pb-1.5 sm:pb-2">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-500" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-500" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-zinc-500" />
        </div>
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TideLogo size={13} mode="dark" />
              <span className="text-[10px] sm:text-xs text-zinc-400 font-normal">Tide Yield Engine</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-zinc-300 bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-[6px]">Self Custodial</span>
          </div>
          <div className="text-lg min-[400px]:text-xl sm:text-3xl font-normal text-white tracking-tight">
            Real Net Yields
          </div>
          <div className="text-[9px] sm:text-xs text-zinc-400 font-normal leading-snug">
            Transparent network fees. No smart contract lockups.
          </div>
        </div>
      </div>
    </div>
  )
}
