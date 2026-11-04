import { useState } from 'react'
import { Cloud, MapIcon, Ship, Radio, Activity, Menu, X } from 'lucide-react'
import WeatherDashboard from './components/weather/WeatherDashboard'
import RoutePlanner from './components/weather/RoutePlanner'

type Page = 'weather' | 'routes' | 'fleet' | 'sos'

export default function App() {
  const [page, setPage] = useState<Page>('weather')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'weather', label: 'Weather Forecast', icon: <Cloud size={20} /> },
    { id: 'routes', label: 'Route Planning', icon: <MapIcon size={20} /> },
    { id: 'fleet', label: 'Fleet Management', icon: <Ship size={20} /> },
    { id: 'sos', label: 'Emergency SOS', icon: <Radio size={20} /> },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                  <Ship size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">KAAPPAAN</h1>
                  <p className="text-xs text-primary-600">Maritime Safety</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="mx-auto text-gray-400 hover:text-gray-600">
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
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className={`${sidebarOpen ? '' : 'text-center'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Activity size={14} className="text-yellow-600" />
              {sidebarOpen && <span className="text-xs text-yellow-700 font-medium">DEMO MODE</span>}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navItems.find(n => n.id === page)?.label}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Bay of Bengal Maritime Weather & Safety System
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Last Updated</div>
                <div className="text-sm font-semibold text-gray-900">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Weather Dashboard */}
          {page === 'weather' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Marine Weather Forecast</h3>
                <p className="text-sm text-gray-600">
                  Real-time weather conditions and 24-hour forecast for fishing zones.
                  Powered by IMD (India Meteorological Department) data.
                </p>
              </div>
              <WeatherDashboard lat={10.0} lng={80.0} />
            </div>
          )}

          {/* Route Planning */}
          {page === 'routes' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather-Aware Route Planning</h3>
                <p className="text-sm text-gray-600">
                  Calculate optimal fishing routes with real-time weather risk assessment.
                  Avoid dangerous conditions and plan safe passages.
                </p>
              </div>
              <RoutePlanner />
            </div>
          )}

          {/* Fleet Management - Coming Soon */}
          {page === 'fleet' && (
            <div className="weather-card p-12 text-center">
              <Ship className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fleet Management</h3>
              <p className="text-gray-600 mb-6">
                Real-time vessel tracking, communication, and trip logging coming soon.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                <Activity size={16} />
                Under Development
              </div>
            </div>
          )}

          {/* Emergency SOS - Coming Soon */}
          {page === 'sos' && (
            <div className="weather-card p-12 text-center">
              <Radio className="mx-auto text-red-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Emergency SOS System</h3>
              <p className="text-gray-600 mb-6">
                One-click emergency alerts with automatic coast guard notification.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                <Activity size={16} />
                Under Development
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
