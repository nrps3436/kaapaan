import { useEffect, useState } from 'react'
import { Ship, Cloud } from 'lucide-react'

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Simulate loading time (2-3 seconds)
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onLoadComplete, 500) // Wait for fade-out animation
    }, 2500)

    return () => clearTimeout(timer)
  }, [onLoadComplete])

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Animated Clouds */}
      <div className="cloud-animation" style={{ left: '-100px' }}>☁️</div>
      <div className="cloud-animation" style={{ left: '-100px' }}>☁️</div>
      <div className="cloud-animation" style={{ left: '-100px' }}>☁️</div>
      
      {/* Loading Content */}
      <div className="loading-content text-center text-white z-10">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="loading-spinner"></div>
            <Ship className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" size={32} />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          KAAPPAAN
        </h1>
        <p className="text-xl text-white/90 mb-2">காப்பான்</p>
        <p className="text-lg text-white/80">Maritime Safety Platform</p>
        
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-white/70">
          <Cloud size={16} />
          <span>Loading weather systems...</span>
        </div>
      </div>
      
      {/* Wave Effect at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-600/30 to-transparent"></div>
    </div>
  )
}
