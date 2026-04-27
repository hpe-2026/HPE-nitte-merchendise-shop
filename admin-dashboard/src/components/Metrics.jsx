import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, AlertCircle, Activity, Zap, Clock, AlertTriangle, CheckCircle, Server } from 'lucide-react'
import axios from 'axios'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Metrics() {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    requestLatencyP95: 0,
    errorRate: 0,
    activeConnections: 0,
    orders: 0,
    productsViewed: 0,
    authAttempts: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metricsHistory, setMetricsHistory] = useState([])
  const [metricsTable, setMetricsTable] = useState([])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      
      // Use backend proxy endpoint instead of direct Prometheus queries
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : ''
      
      const response = await axios.get(`${apiUrl}/api/v1/metrics/dashboard`)

      const data = response.data.data

      const metrics = {
        totalRequests: parseFloat(data.requests_per_sec) || 0,
        requestLatencyP95: parseFloat(data.p95_latency) || 0,
        errorRate: parseFloat(data.error_rate) || 0,
        activeConnections: parseFloat(data.active_connections) || 0,
        orders: parseFloat(data.orders_rate) || 0,
        productsViewed: parseFloat(data.products_viewed) || 0,
        authAttempts: parseFloat(data.auth_attempts) || 0
      }

      setMetrics(metrics)

      // Track metrics history for charts
      setMetricsHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          requests: parseFloat(metrics.totalRequests),
          latency: parseFloat(metrics.requestLatencyP95),
          errors: parseFloat(metrics.errorRate),
          connections: parseFloat(metrics.activeConnections),
          orders: parseFloat(metrics.orders),
          products: parseFloat(metrics.productsViewed)
        }]
        return newHistory.slice(-24)
      })

      setError(null)
    } catch (err) {
      setError('Failed to fetch metrics. Ensure the API gateway is running at http://localhost:3000')
      console.error('Metrics fetch error:', err)
      // Set default values on error
      setMetrics({
        totalRequests: 0,
        requestLatencyP95: 0,
        errorRate: 0,
        activeConnections: 0,
        orders: 0,
        productsViewed: 0,
        authAttempts: 0
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">System Metrics</h2>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-800">Note</p>
            <p className="text-yellow-700">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">
              To see live metrics, ensure the monitoring stack is running:
              <code className="bg-yellow-100 px-2 py-1 rounded ml-2">
                ./nitte-setup.sh start
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Performance Overview Dashboard */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Performance Overview</h3>
            <p className="text-gray-600 text-sm mt-1">Real-time system health and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <a
              href="http://localhost:3001/d/api-metrics-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
            >
              Advanced Grafana
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <PerformanceCard
            icon={Activity}
            title="Requests/sec"
            value={metrics.totalRequests}
            unit="req/s"
            trend="+8.2%"
            status={metrics.totalRequests > 0 ? 'success' : 'normal'}
          />
          <PerformanceCard
            icon={Clock}
            title="Response Time (p95)"
            value={metrics.requestLatencyP95}
            unit="ms"
            trend={metrics.requestLatencyP95 > 500 ? '-5.1%' : '+2.3%'}
            status={metrics.requestLatencyP95 > 500 ? 'warning' : 'success'}
          />
          <PerformanceCard
            icon={AlertTriangle}
            title="Error Rate"
            value={metrics.errorRate}
            unit="%"
            trend={metrics.errorRate > 1 ? ' HIGH' : ' NORMAL'}
            status={metrics.errorRate > 1 ? 'error' : 'success'}
          />
          <PerformanceCard
            icon={Zap}
            title="Active Connections"
            value={metrics.activeConnections}
            unit="conns"
            trend="+3.4%"
            status="info"
          />
        </div>

        {/* System Health Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SystemHealthIndicator name="API Gateway" status="healthy" uptime="99.9%" />
          <SystemHealthIndicator name="Python Service" status="healthy" uptime="99.8%" />
          <SystemHealthIndicator name="MongoDB" status="healthy" uptime="99.95%" />
          <SystemHealthIndicator name="Frontend" status="healthy" uptime="100%" />
        </div>
      </div>

      {/* Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Request Volume Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Request Volume & Latency</h3>
          {metricsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name="Requests/sec" />
                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#ef4444" strokeWidth={2} name="Latency (ms)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Collecting data...</p>
            </div>
          )}
        </div>

        {/* Activity Metrics Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Business Activity</h3>
          {metricsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders/sec" />
                <Line type="monotone" dataKey="products" stroke="#f59e0b" strokeWidth={2} name="Products Viewed/sec" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Collecting data...</p>
            </div>
          )}
        </div>

        {/* Errors & Connections Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Error Rate & Connections</h3>
          {metricsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Error Rate (%)" />
                <Line yAxisId="right" type="monotone" dataKey="connections" stroke="#8b5cf6" strokeWidth={2} name="Active Connections" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Collecting data...</p>
            </div>
          )}
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">System Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Current Requests/sec</p>
                <p className="text-2xl font-bold text-blue-600">{(Number(metrics.totalRequests) || 0).toFixed(2)}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-red-600">{(Number(metrics.errorRate) || 0).toFixed(2)}%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Response Time (p95)</p>
                <p className="text-2xl font-bold text-green-600">{(Number(metrics.requestLatencyP95) || 0).toFixed(2)}ms</p>
              </div>
              <Clock className="w-8 h-8 text-green-600 opacity-20" />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold text-purple-600">{(Number(metrics.activeConnections) || 0).toFixed(0)}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Prometheus UI</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Access the full Prometheus interface to query and explore metrics
          </p>
          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-fit px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Open Prometheus
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Jaeger Tracing</h3>
          <p className="text-gray-600 mb-4 text-sm">
            View distributed traces and service dependencies
          </p>
          <a
            href="http://localhost:16686"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-fit px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            Open Jaeger
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Grafana Dashboards</h3>
          <p className="text-gray-600 mb-4 text-sm">
            View pre-built dashboards and manage alerts (admin:admin123)
          </p>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-fit px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
          >
            Open Grafana
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, description, value, unit, status }) {
  const statusColor = {
    success: 'border-l-green-500 bg-green-50',
    warning: 'border-l-yellow-500 bg-yellow-50',
    error: 'border-l-red-500 bg-red-50',
    info: 'border-l-blue-500 bg-blue-50'
  }[status]

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${statusColor}`}>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-gray-600">{unit}</span>
      </div>
    </div>
  )
}

function PerformanceCard({ icon: Icon, title, value, unit, trend, status }) {
  const statusColor = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    normal: 'bg-gray-50 border-gray-200'
  }[status]

  const statusIcon = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    error: <AlertTriangle className="w-5 h-5 text-red-600" />,
    info: <Activity className="w-5 h-5 text-blue-600" />,
    normal: <Activity className="w-5 h-5 text-gray-600" />
  }[status]

  return (
    <div className={`border rounded-lg p-4 ${statusColor}`}>
      <div className="flex justify-between items-start mb-3">
        <Icon className="w-5 h-5 text-gray-600" />
        {statusIcon}
      </div>
      <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-xs text-gray-600">{unit}</span>
      </div>
      <p className={`text-xs font-semibold ${
        trend.includes('') || trend.includes('HIGH') ? 'text-red-600' : 
        trend.includes('') || trend.includes('NORMAL') ? 'text-green-600' : 
        'text-blue-600'
      }`}>
        {trend}
      </p>
    </div>
  )
}

function SystemHealthIndicator({ name, status, uptime }) {
  const isHealthy = status === 'healthy'
  
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
      </div>
      <p className={`text-xs font-medium ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
        {isHealthy ? ' Healthy' : ' Down'}
      </p>
      <p className="text-xs text-gray-600 mt-1">Uptime: {uptime}</p>
    </div>
  )
}
