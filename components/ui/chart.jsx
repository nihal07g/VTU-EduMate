// Simplified chart component for JavaScript compatibility
import React from "react"

// Simple chart context
const ChartContext = React.createContext({})

export const useChart = () => {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer")
  }
  return context
}

// Basic chart container
export const ChartContainer = React.forwardRef(({ children, config, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
})

ChartContainer.displayName = "ChartContainer"

// Basic chart tooltip
export const ChartTooltip = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
})

ChartTooltip.displayName = "ChartTooltip"

// Basic chart legend
export const ChartLegend = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
})

ChartLegend.displayName = "ChartLegend"

// Basic tooltip content
export const ChartTooltipContent = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
})

ChartTooltipContent.displayName = "ChartTooltipContent"

// Basic legend content
export const ChartLegendContent = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
})

ChartLegendContent.displayName = "ChartLegendContent"

// Utility function (simplified)
export function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }
  
  return config?.[key] || undefined
}