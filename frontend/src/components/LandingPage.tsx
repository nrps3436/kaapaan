import { Ship, Cloud, Navigation, Radio, Shield, Waves, ArrowRight, MapPin, TrendingUp } from 'lucide-react'

interface LandingPageProps {
  onEnter: () => void
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-container">
          <div className="nav-content">
            <div className="nav-brand">
              <div className="nav-logo">
                <Ship size={32} />
              </div>
              <div>
                <h1 className="nav-title tamil-title">காப்பான்</h1>
                <p className="nav-subtitle">Maritime Safety</p>
              </div>
            </div>
            <div className="nav-links">
              <a href="#home" className="nav-link">Home</a>
              <a href="#features" className="nav-link">Features</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#safety" className="nav-link">Safety</a>
              <button onClick={onEnter} className="nav-button">
                Launch Platform
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          {/* Animated waves */}
          <div className="hero-waves">
            <div className="hero-wave hero-wave-1"></div>
            <div className="hero-wave hero-wave-2"></div>
            <div className="hero-wave hero-wave-3"></div>
          </div>
        </div>
        
        <div className="landing-container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Shield size={16} />
              <span>Maritime Safety Platform</span>
            </div>
            <h1 className="hero-title">
              PLAN YOUR JOURNEY
              <br />
              <span className="hero-title-highlight">WITH SAFETY</span>
            </h1>
            <p className="hero-description">
              Reach your destination safe. We will take care of your demands and fulfill all your needs.
              You are the best travel agents of all time &amp; we cannot deny Allah control.
            </p>
            <div className="hero-buttons">
              <button onClick={onEnter} className="btn-primary">
                Get Started
                <ArrowRight size={20} />
              </button>
              <button className="btn-secondary">
                Learn More
              </button>
            </div>
            
            {/* Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">5,000+</div>
                <div className="stat-label">Fishermen Protected</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Real-time Monitoring</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse"></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">Comprehensive Maritime Safety</h2>
            <p className="section-description">
              Advanced technology protecting fishermen in the Bay of Bengal
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue">
                <Cloud size={32} />
              </div>
              <h3 className="feature-title">Weather Forecasting</h3>
              <p className="feature-description">
                Real-time weather updates and 72-hour forecasts powered by IMD data with risk assessment.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-green">
                <Navigation size={32} />
              </div>
              <h3 className="feature-title">Route Planning</h3>
              <p className="feature-description">
                Weather-aware route optimization to avoid dangerous conditions and ensure safe passages.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-purple">
                <MapPin size={32} />
              </div>
              <h3 className="feature-title">Fleet Tracking</h3>
              <p className="feature-description">
                Live GPS tracking of all vessels with battery monitoring and signal strength indicators.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-red">
                <Radio size={32} />
              </div>
              <h3 className="feature-title">Emergency SOS</h3>
              <p className="feature-description">
                One-click distress signal with automatic coast guard notification and location sharing.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-orange">
                <TrendingUp size={32} />
              </div>
              <h3 className="feature-title">Risk Assessment</h3>
              <p className="feature-description">
                AI-powered risk scoring (0-100) for current conditions and forecast periods.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-teal">
                <Waves size={32} />
              </div>
              <h3 className="feature-title">Wave Analysis</h3>
              <p className="feature-description">
                Detailed wave height, direction, and sea state analysis for safer navigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Sail Safer?</h2>
            <p className="cta-description">
              Join thousands of fishermen using காப்பான் for safer maritime operations
            </p>
            <button onClick={onEnter} className="cta-button">
              Launch Platform Now
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <Ship size={40} />
              </div>
              <div>
                <h3 className="footer-title tamil-title">காப்பான்</h3>
                <p className="footer-subtitle">Maritime Safety Platform</p>
              </div>
            </div>
            <p className="footer-text">
              &copy; 2024 காப்பான் (KAAPPAAN). Protecting fishermen in the Bay of Bengal.
              <br />
              Final Year Project - Maritime Safety &amp; Navigation System
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
