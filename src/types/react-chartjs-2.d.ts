// Type definitions for react-chartjs-2
import { ChartType, ChartData, ChartOptions } from 'chart.js'
import * as React from 'react'

declare module 'react-chartjs-2' {
  export interface ChartComponentProps {
    data: ChartData<any>
    options?: ChartOptions<any>
    plugins?: any[]
    type?: ChartType
    width?: number
    height?: number
    id?: string
    className?: string
    fallbackContent?: React.ReactNode
    redraw?: boolean
    datasetIdKey?: string
  }

  export class Chart<
    T extends ChartType = ChartType,
  > extends React.Component<ChartComponentProps> {}

  export class Line extends React.Component<ChartComponentProps> {}
  export class Bar extends React.Component<ChartComponentProps> {}
  export class Pie extends React.Component<ChartComponentProps> {}
  export class Doughnut extends React.Component<ChartComponentProps> {}
  export class PolarArea extends React.Component<ChartComponentProps> {}
  export class Radar extends React.Component<ChartComponentProps> {}
  export class Scatter extends React.Component<ChartComponentProps> {}
  export class Bubble extends React.Component<ChartComponentProps> {}
}
