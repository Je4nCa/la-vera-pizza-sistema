/**
 * Registers the Chart.js components used by the dashboard and reports.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler, ArcElement,
)
