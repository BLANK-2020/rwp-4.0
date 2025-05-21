import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  ScaleOptionsByType,
  CartesianScaleOptions,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

// Define the event types
export const EVENT_TYPES = ['job_viewed', 'apply_started', 'apply_completed', 'retarget_triggered']

// Define the chart colors
export const CHART_COLORS = {
  blue: 'rgba(54, 162, 235, 0.5)',
  green: 'rgba(75, 192, 192, 0.5)',
  red: 'rgba(255, 99, 132, 0.5)',
  orange: 'rgba(255, 159, 64, 0.5)',
  purple: 'rgba(153, 102, 255, 0.5)',
  yellow: 'rgba(255, 205, 86, 0.5)',
  grey: 'rgba(201, 203, 207, 0.5)',
}

// Define the chart border colors
export const CHART_BORDER_COLORS = {
  blue: 'rgb(54, 162, 235)',
  green: 'rgb(75, 192, 192)',
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  purple: 'rgb(153, 102, 255)',
  yellow: 'rgb(255, 205, 86)',
  grey: 'rgb(201, 203, 207)',
}

// Define the event type colors
export const EVENT_TYPE_COLORS: Record<string, string> = {
  job_viewed: CHART_COLORS.blue,
  apply_started: CHART_COLORS.green,
  apply_completed: CHART_COLORS.purple,
  retarget_triggered: CHART_COLORS.orange,
  ab_test_assignment: CHART_COLORS.yellow,
  ab_test_conversion: CHART_COLORS.red,
}

// Define the event type border colors
export const EVENT_TYPE_BORDER_COLORS: Record<string, string> = {
  job_viewed: CHART_BORDER_COLORS.blue,
  apply_started: CHART_BORDER_COLORS.green,
  apply_completed: CHART_BORDER_COLORS.purple,
  retarget_triggered: CHART_BORDER_COLORS.orange,
  ab_test_assignment: CHART_BORDER_COLORS.yellow,
  ab_test_conversion: CHART_BORDER_COLORS.red,
}

// Create type-safe chart options
export const createLineChartOptions = (title: string): ChartOptions<'line'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  }
}

export const createBarChartOptions = (title: string): ChartOptions<'bar'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Category',
        },
      },
    },
  }
}

export const createDoughnutChartOptions = (title: string): ChartOptions<'doughnut'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
    },
  }
}

export const createPieChartOptions = (title: string): ChartOptions<'pie'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
    },
  }
}

// Create dual axis chart options for A/B testing
export const createDualAxisChartOptions = (title: string): ChartOptions<'bar'> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Conversion Rate (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Variation',
        },
      },
    },
  }
}
