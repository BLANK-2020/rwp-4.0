// Type definitions for Chart.js
import { ChartType, ChartData, ChartOptions } from 'chart.js'

declare module 'chart.js' {
  // Extend the ChartOptions interface to include our custom properties
  interface ScaleOptionsByType {
    linear: {
      beginAtZero?: boolean
      min?: number
      max?: number
      ticks?: {
        stepSize?: number
        maxRotation?: number
        minRotation?: number
      }
      title?: {
        display?: boolean
        text?: string
        font?: {
          size?: number
        }
      }
      grid?: {
        drawOnChartArea?: boolean
      }
    }
    category: {
      ticks?: {
        maxRotation?: number
        minRotation?: number
      }
      title?: {
        display?: boolean
        text?: string
        font?: {
          size?: number
        }
      }
    }
  }

  // Extend the ChartOptions interface to include our custom properties
  interface PluginOptionsByType {
    line: {
      legend?: {
        position?: 'top' | 'left' | 'bottom' | 'right' | 'chartArea'
        display?: boolean
      }
      title?: {
        display?: boolean
        text?: string
        font?: {
          size?: number
        }
      }
      tooltip?: {
        mode?: 'index' | 'nearest' | 'point' | 'dataset' | 'x' | 'y'
        intersect?: boolean
        callbacks?: {
          label?: (context: any) => string
        }
      }
    }
    bar: {
      legend?: {
        position?: 'top' | 'left' | 'bottom' | 'right' | 'chartArea'
        display?: boolean
      }
      title?: {
        display?: boolean
        text?: string
        font?: {
          size?: number
        }
      }
      tooltip?: {
        mode?: 'index' | 'nearest' | 'point' | 'dataset' | 'x' | 'y'
        intersect?: boolean
        callbacks?: {
          label?: (context: any) => string
        }
      }
    }
    pie: {
      legend?: {
        position?: 'top' | 'left' | 'bottom' | 'right' | 'chartArea'
        display?: boolean
      }
      title?: {
        display?: boolean
        text?: string
        font?: {
          size?: number
        }
      }
      tooltip?: {
        callbacks?: {
          label?: (context: any) => string
        }
      }
    }
    doughnut: {
      legend?: {
        position?: 'top' | 'left' | 'bottom' | 'right' | 'chartArea'
        display?: boolean
      }
      title?: {
        display?: boolean
        text?: string
        font?: {
          size?: number
        }
      }
      tooltip?: {
        callbacks?: {
          label?: (context: any) => string
        }
      }
    }
  }
}

// Extend the react-chartjs-2 module
declare module 'react-chartjs-2' {
  export interface ChartProps {
    data: ChartData<ChartType>
    options?: ChartOptions<ChartType>
    width?: number
    height?: number
    id?: string
    className?: string
    fallbackContent?: React.ReactNode
    redraw?: boolean
    datasetIdKey?: string
    type?: ChartType
  }
}
