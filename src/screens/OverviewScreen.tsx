import React from 'react'
import { PortfolioSummary } from '../components/dashboard/PortfolioSummary'

interface OverviewScreenProps {
  onNavigateEarn: () => void
  onNavigateStake: () => void
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  onNavigateEarn,
  onNavigateStake,
}) => {
  return (
    <div className="space-y-8">
      <PortfolioSummary
        onNavigateEarn={onNavigateEarn}
        onNavigateStake={onNavigateStake}
      />
    </div>
  )
}
