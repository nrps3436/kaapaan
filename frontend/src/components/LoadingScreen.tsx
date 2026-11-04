import { useEffect, useState } from 'react'
import { Ship, Cloud, Waves, Anchor, Navigation } from 'lucide-react'

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + 2
      })
    }, 30)

    // Complete loading
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onLoadComplete, 800)
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearInterval(progressTimer)
    }
  }, [onLoadComplete])

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Animated Background Waves */}
      <div className="wave-background">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        {/* Clouds */}
        <div className="cloud-animation cloud-1">☁️</div>
        <div className="cloud-animation cloud-2">☁️</div>
        <div className="cloud-animation cloud-3">☁️</div>
        
        {/* Floating Icons */}
        <div className="floating-icon icon-1">
          <Anchor className="text-white/30" size={24} />
        </div>
        <div className="floating-icon icon-2">
          <Navigation className="text-white/30" size={20} />
        </div>
        <div className="floating-icon icon-3">
          <Waves className="text-white/30" size={22} />
        </div>
      </div>
      
      {/* Main Loading Content */}
      <div className="loading-content-wrapper">
        {/* Animated Logo Container */}
        <div className="logo-container">
          {/* Rotating Circles */}
          <div className="circle-orbit orbit-1"></div>
          <div className="circle-orbit orbit-2"></div>
          <div className="circle-orbit orbit-3"></div>
          
          {/* Center Ship Icon */}
          <div className="ship-icon-container">
            <Ship size={48} className="text-white ship-icon" />
          </div>
        </div>
        
        {/* Brand Name with Letter Animation */}
        <div className="brand-container">
          <h1 className="brand-title">
            <span className="letter" style={{ animationDelay: '0.1s' }}>K</span>
            <span className="letter" style={{ animationDelay: '0.2s' }}>A</span>
            <span className="letter" style={{ animationDelay: '0.3s' }}>A</span>
            <span className="letter" style={{ animationDelay: '0.4s' }}>P</span>
            <span className="letter" style={{ animationDelay: '0.5s' }}>P</span>
            <span className="letter" style={{ animationDelay: '0.6s' }}>A</span>
            <span className="letter" style={{ animationDelay: '0.7s' }}>A</span>
            <span className="letter" style={{ animationDelay: '0.8s' }}>N</span>
          </h1>
          
          {/* Tamil Text */}
          <div className="tamil-text">
            <span className="tamil-letter" style={{ animationDelay: '0.9s' }}>கா</span>
            <span className="tamil-letter" style={{ animationDelay: '1.0s' }}>ப்</span>
            <span className="tamil-letter" style={{ animationDelay: '1.1s' }}>பா</span>
            <span className="tamil-letter" style={{ animationDelay: '1.2s' }}>ன்</span>
          </div>
          
          {/* Tagline */}
          <p className="tagline">Maritime Safety Platform</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{progress}%</div>
        </div>
        
        {/* Status Messages with Typewriter Effect */}
        <div className="status-messages">
          <div className="status-item" style={{ animationDelay: '0.5s' }}>
            <Cloud size={16} className="status-icon" />
            <span>Initializing weather systems...</span>
          </div>
          <div className="status-item" style={{ animationDelay: '1.0s' }}>
            <Ship size={16} className="status-icon" />
            <span>Loading vessel tracking...</span>
          </div>
          <div className="status-item" style={{ animationDelay: '1.5s' }}>
            <Waves size={16} className="status-icon" />
            <span>Connecting to maritime network...</span>
          </div>
        </div>
      </div>

      {/* Particles Effect */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}
