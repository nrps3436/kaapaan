import { useState } from 'react'
import { Cloud, MapIcon, Ship, Radio, Menu, X } from 'lucide-react'
import WeatherDashboard from './components/weather/WeatherDashboard'
import RoutePlanner from './components/weather/RoutePlanner'
import FleetManagement from './components/FleetManagement'
import SOSSystem from './components/SOSSystem'
import LoadingScreen from './components/LoadingScreen'
import LandingPage from './components/LandingPage'
import { ErrorBoundary } from './components/common/ErrorBoundary'

type Page = 'weather' | 'routes' | 'fleet' | 'sos'

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState<Page>('weather')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleEnterApp = () => {
    setShowLanding(false)
    setLoading(true)
  }

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'weather', label: 'Weather Forecast', icon: <Cloud size={20} /> },
    { id: 'routes', label: 'Route Planning', icon: <MapIcon size={20} /> },
    { id: 'fleet', label: 'Fleet Management', icon: <Ship size={20} /> },
    { id: 'sos', label: 'Emergency SOS', icon: <Radio size={20} /> },
  ]

  if (showLanding) {
    return (
      <ErrorBoundary>
        <LandingPage onEnter={handleEnterApp} />
      </ErrorBoundary>
    )
  }

  if (loading) {
    return (
      <ErrorBoundary>
        <LoadingScreen onLoadComplete={() => setLoading(false)} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside 
          className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                    <Ship size={20} className="text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">
                      <span className="tamil-title">காப்பான்</span>
                    </h1>
                    <p className="text-xs text-primary-600">Maritime Safety</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Collapse sidebar"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="mx-auto text-gray-400 hover:text-gray-600"
                aria-label="Expand sidebar"
              >
                <Menu size={20} />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center'} py-3 rounded-xl text-sm font-medium transition-all ${
                  page === item.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.label : undefined}
                aria-label={item.label}
                aria-current={page === item.id ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer with Tamil branding */}
          <div className="p-4 border-t border-gray-200">
            {sidebarOpen ? (
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700 tamil-title">காப்பான்</p>
                <p className="text-xs text-gray-500 mt-1">Protecting Our Fishermen</p>
              </div>
            ) : (
              <div className="text-center text-primary-600 font-bold text-lg tamil-title">
                கா
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto" role="main">
          <div className="max-w-7xl mx-auto p-6">
            <ErrorBoundary>
              {page === 'weather' && <WeatherDashboard />}
              {page === 'routes' && <RoutePlanner />}
              {page === 'fleet' && <FleetManagement />}
              {page === 'sos' && <SOSSystem />}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
