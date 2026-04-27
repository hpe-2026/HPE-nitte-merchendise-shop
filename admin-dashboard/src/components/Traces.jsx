import { ExternalLink, AlertCircle, RefreshCw, CheckCircle, Activity, TrendingUp, Clock, Zap } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

const JAEGER_PROXY_API = 'http://localhost:3000/api/v1/jaeger'
const JAEGER_UI = 'http://localhost:16686'

export default function Traces() {
  const [jaegerStatus, setJaegerStatus] = useState('checking')
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [traces, setTraces] = useState([])
  const [stats, setStats] = useState({ totalTraces: 0, avgDuration: 0, errorRate: 0 })
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // Define helper functions first
  const checkJaegerHealth = useCallback(async () => {
    try {
      const response = await fetch(`${JAEGER_PROXY_API}/health`, {
        method: 'GET',
        credentials: 'include',
        timeout: 8000
      })
      if (response.ok) {
        const data = await response.json()
        setJaegerStatus(data.status === 'online' ? 'online' : 'offline')
      } else {
        setJaegerStatus('offline')
      }
    } catch (err) {
      console.error('Health check failed:', err)
      setJaegerStatus('offline')
    }
  }, [])

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(`${JAEGER_PROXY_API}/services`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Sort services alphabetically for stable ordering
        const sortedServices = (data.data || []).sort()
        setServices(sortedServices)
        if (sortedServices && sortedServices.length > 0) {
          setSelectedService(sortedServices[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch services:', err)
    }
  }, [])

  const calculateTraceDuration = (spans) => {
    if (!spans || spans.length === 0) return null
    
    let minStartTime = Infinity
    let maxEndTime = 0
    
    spans.forEach(span => {
      const startTime = span.startTime || 0
      const duration = span.duration || 0
      
      minStartTime = Math.min(minStartTime, startTime)
      maxEndTime = Math.max(maxEndTime, startTime + duration)
    })
    
    return maxEndTime > minStartTime ? maxEndTime - minStartTime : null
  }

  const fetchTraces = useCallback(async (service, page = 1) => {
    setLoading(true)
    try {
      const offset = (page - 1) * itemsPerPage
      const response = await fetch(`${JAEGER_PROXY_API}/traces?service=${service}&limit=${itemsPerPage}&offset=${offset}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const tracesList = data.data || []
        setTraces(tracesList)
        
        // Calculate total pages
        const total = data.total || 0
        const pages = Math.ceil(total / itemsPerPage)
        setTotalPages(pages)
        
        // Calculate stats
        if (tracesList.length > 0) {
          const durations = tracesList
            .map(t => calculateTraceDuration(t.spans))
            .filter(d => d !== null)
          
          const totalDuration = durations.reduce((sum, d) => sum + d, 0)
          const avgDuration = durations.length > 0 
            ? Math.round(totalDuration / durations.length / 1000) // Convert to ms
            : 0
          
          const errors = tracesList.filter(t => {
            const spans = t.spans || []
            return spans.some(s => s.tags?.some(tag => tag.key === 'error' && tag.value === true))
          }).length
          const errorRate = Math.round((errors / tracesList.length) * 100)
          
          setStats({
            totalTraces: data.total || tracesList.length,
            avgDuration,
            errorRate
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch traces:', err)
    } finally {
      setLoading(false)
    }
  }, [itemsPerPage])

  const formatDuration = (microseconds) => {
    if (!microseconds) return '0ms'
    const ms = Math.round(microseconds / 1000)
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(Math.floor(timestamp / 1000))
    return date.toLocaleTimeString()
  }

  const getTraceUrl = (traceId) => {
    return `${JAEGER_UI}/trace/${traceId}`
  }

  const getTraceName = (spans) => {
    if (!spans || spans.length === 0) return 'Unknown'
    // Find the root span (one with no parent references)
    const rootSpan = spans.find(s => !s.references || s.references.length === 0)
    const rootName = rootSpan?.operationName || spans[0]?.operationName || 'Unknown'
    
    // Check if trace includes MongoDB operations
    const mongodbOps = spans
      .filter(s => s.operationName?.toLowerCase().includes('mongodb'))
      .map(s => s.operationName.replace('mongodb.', ''))
      .join(', ')
    
    if (mongodbOps) {
      return `${rootName} [DB: ${mongodbOps}]`
    }
    return rootName
  }

  const calculateTraceStartTime = (spans) => {
    if (!spans || spans.length === 0) return null
    
    const minStartTime = Math.min(...spans.map(s => s.startTime || 0))
    return minStartTime > 0 ? minStartTime : null
  }

  // Now define useEffects after all functions
  useEffect(() => {
    const fetchData = async () => {
      await checkJaegerHealth()
      await fetchServices()
    }
    fetchData()
    // Don't refetch traces on this interval - let user control pagination
    const interval = setInterval(() => {
      checkJaegerHealth()
    }, 15000)
    return () => clearInterval(interval)
  }, [checkJaegerHealth, fetchServices])

  useEffect(() => {
    if (selectedService) {
      setCurrentPage(1)
      fetchTraces(selectedService, 1)
    }
  }, [selectedService, fetchTraces])

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Distributed Tracing</h2>
        <button
          onClick={() => {
            checkJaegerHealth()
            fetchServices()
            if (selectedService) {
              setCurrentPage(1)
              fetchTraces(selectedService, 1)
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status Alert */}
      <div className={`mb-6 p-4 border rounded-lg flex gap-3 ${
        jaegerStatus === 'online' ? 'bg-green-50 border-green-200' :
        jaegerStatus === 'offline' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex-shrink-0 pt-0.5">
          {jaegerStatus === 'online' && <CheckCircle className="w-6 h-6 text-green-600" />}
          {jaegerStatus === 'offline' && <AlertCircle className="w-6 h-6 text-red-600" />}
          {jaegerStatus === 'checking' && <Activity className="w-6 h-6 text-blue-600" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${
            jaegerStatus === 'online' ? 'text-green-800' :
            jaegerStatus === 'offline' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {jaegerStatus === 'online' && ' Jaeger is Running'}
            {jaegerStatus === 'offline' && ' Jaeger is Offline'}
            {jaegerStatus === 'checking' && 'Checking Jaeger Status...'}
          </p>
          {jaegerStatus === 'offline' && (
            <p className="text-red-700 text-sm mt-1">
              Jaeger is not accessible. Run: <code className="bg-red-100 px-2 py-1 rounded text-xs font-mono">./nitte-setup.sh start</code>
            </p>
          )}
        </div>
      </div>

      {jaegerStatus === 'online' && (
        <>
          {/* Service Selector */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Select Service</h3>
            <div className="flex gap-2 flex-wrap">
              {services.length > 0 ? (
                services.map(service => (
                  <button
                    key={service}
                    onClick={() => setSelectedService(service)}
                    className={`px-4 py-2 rounded-lg border font-medium transition ${
                      selectedService === service
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-600'
                    }`}
                  >
                    {service}
                  </button>
                ))
              ) : (
                <p className="text-gray-500">No services found. Generate some traces first!</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {selectedService && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Traces</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTraces}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Avg Duration</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgDuration}ms</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                stats.errorRate > 0 ? 'border-l-red-500' : 'border-l-green-500'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Error Rate</p>
                    <p className={`text-3xl font-bold mt-2 ${
                      stats.errorRate > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>{stats.errorRate}%</p>
                  </div>
                  <Zap className={`w-8 h-8 ${stats.errorRate > 0 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
              </div>
            </div>
          )}

          {/* Recent Traces */}
          {selectedService && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Traces</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Items per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        const newItemsPerPage = parseInt(e.target.value)
                        setItemsPerPage(newItemsPerPage)
                        setCurrentPage(1)
                        // Use newItemsPerPage directly to avoid stale closure
                        setLoading(true)
                        fetch(`${JAEGER_PROXY_API}/traces?service=${selectedService}&limit=${newItemsPerPage}&offset=0`, {
                          credentials: 'include'
                        }).then(response => {
                          if (response.ok) {
                            return response.json().then(data => {
                              const tracesList = data.data || []
                              setTraces(tracesList)
                              const total = data.total || 0
                              const pages = Math.ceil(total / newItemsPerPage)
                              setTotalPages(pages)
                              
                              if (tracesList.length > 0) {
                                const durations = tracesList
                                  .map(t => calculateTraceDuration(t.spans))
                                  .filter(d => d !== null)
                                const totalDuration = durations.reduce((sum, d) => sum + d, 0)
                                const avgDuration = durations.length > 0 
                                  ? Math.round(totalDuration / durations.length / 1000)
                                  : 0
                                const errors = tracesList.filter(t => {
                                  const spans = t.spans || []
                                  return spans.some(s => s.tags?.some(tag => tag.key === 'error' && tag.value === true))
                                }).length
                                const errorRate = Math.round((errors / tracesList.length) * 100)
                                setStats({
                                  totalTraces: data.total || tracesList.length,
                                  avgDuration,
                                  errorRate
                                })
                              }
                              setLoading(false)
                            })
                          }
                          setLoading(false)
                        }).catch(err => {
                          console.error('Failed to fetch traces:', err)
                          setLoading(false)
                        })
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading traces...</p>
                </div>
              ) : traces.length > 0 ? (
                <>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Trace ID</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Trace Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Spans</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {traces.map((trace) => {
                          // Check for error in spans - look for error tags or HTTP status >= 400
                          const hasError = trace.spans?.some(s => 
                            s.tags?.some(tag => {
                              // Check for explicit error tag
                              if (tag.key === 'error' && tag.value === true) return true
                              // Check for OpenTelemetry HTTP status code >= 400
                              if (tag.key === 'http.response.status_code' && tag.value >= 400) return true
                              // Check for http.status_code >= 400
                              if (tag.key === 'http.status_code' && tag.value >= 400) return true
                              return false
                            })
                          )
                          const traceDuration = calculateTraceDuration(trace.spans)
                          const traceStartTime = calculateTraceStartTime(trace.spans)
                          
                          return (
                            <tr key={trace.traceID} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-xs font-mono text-blue-600">
                                {trace.traceID?.slice(0, 16)}...
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {getTraceName(trace.spans)}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {trace.spans?.length || 0}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDuration(traceDuration)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatTime(traceStartTime)}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  hasError
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {hasError ? 'Error' : 'OK'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <a
                                  href={getTraceUrl(trace.traceID)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  View
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-semibold">
                        {Math.min(currentPage * itemsPerPage, stats.totalTraces)}
                      </span>{' '}
                      of <span className="font-semibold">{stats.totalTraces}</span> traces
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => {
                          const newPage = currentPage - 1
                          setCurrentPage(newPage)
                          fetchTraces(selectedService, newPage)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">
                          Page <span className="font-semibold">{currentPage}</span> of{' '}
                          <span className="font-semibold">{Math.max(1, totalPages)}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const newPage = currentPage + 1
                          setCurrentPage(newPage)
                          fetchTraces(selectedService, newPage)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No traces found. Make some API requests to generate traces.</p>
                  <p className="text-sm mt-2">Try: <code className="bg-gray-100 px-2 py-1 rounded">curl http://localhost:3000/api/v1/health</code></p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {jaegerStatus === 'offline' && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Jaeger is Offline</h3>
          <p className="text-gray-600 mb-4">Start all services to enable distributed tracing:</p>
          <code className="bg-gray-100 px-4 py-2 rounded block text-sm font-mono">./nitte-setup.sh start</code>
        </div>
      )}
    </div>
  )
}

