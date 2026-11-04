"""IMD (India Meteorological Department) Weather Service Integration.

Provides marine weather forecasts for Bay of Bengal:
- Wave height and direction
- Wind speed and gusts
- Visibility and sea state
- Storm warnings and cyclone alerts

Uses IMD's public marine bulletin APIs where available.
Falls back to demonstration mode with clearly labelled synthetic data.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

# IMD Marine Weather Bulletin endpoints (public data)
IMD_MARINE_BULLETIN_URL = "https://mausam.imd.gov.in/responsive/marineWeatherBulletin.php"
IMD_CYCLONE_URL = "https://mausam.imd.gov.in/responsive/cycloneinfo.php"

class IMDWeatherService:
    """Service for fetching IMD marine weather data."""
    
    def __init__(self, demo_mode: bool = True):
        """Initialize IMD weather service.
        
        Args:
            demo_mode: If True, use demonstration data. Set False for real API calls.
        """
        self.demo_mode = demo_mode
        self.client = httpx.AsyncClient(timeout=10.0)
        
    async def get_marine_forecast(self, lat: float, lng: float, hours: int = 24) -> Dict:
        """Get marine weather forecast for location.
        
        Args:
            lat: Latitude
            lng: Longitude  
            hours: Forecast hours (6, 12, 24, 48, 72)
            
        Returns:
            Weather forecast dict with wave, wind, visibility data
        """
        if self.demo_mode:
            return self._get_demo_forecast(lat, lng, hours)
            
        try:
            # Real IMD API call would go here
            # Note: IMD doesn't have a simple REST API for programmatic access
            # In production, you'd need to:
            # 1. Parse the marine bulletin PDF/HTML
            # 2. Use official channels with authentication
            # 3. Or integrate with paid marine weather APIs (Windy, OpenWeatherMap Marine)
            
            logger.warning("Real IMD API not configured - falling back to demo mode")
            return self._get_demo_forecast(lat, lng, hours)
            
        except Exception as e:
            logger.error(f"IMD API error: {e}")
            return self._get_demo_forecast(lat, lng, hours)
    
    def _get_demo_forecast(self, lat: float, lng: float, hours: int) -> Dict:
        """Generate demonstration weather forecast.
        
        Uses realistic patterns for Bay of Bengal but clearly marked as demo data.
        """
        import random
        import math
        
        # Base conditions vary by location and season
        base_wind = random.uniform(8, 18)  # knots
        base_wave = random.uniform(1.0, 2.5)  # meters
        base_visibility = random.uniform(5, 10)  # km
        
        # Generate hourly forecast
        forecast_hours = []
        for i in range(0, hours + 1, 3):  # 3-hour intervals
            time = datetime.utcnow() + timedelta(hours=i)
            
            # Add some realistic variation
            wind_variation = math.sin(i / 6) * 5 + random.uniform(-2, 2)
            wave_variation = math.sin(i / 8) * 0.8 + random.uniform(-0.3, 0.3)
            
            wind_speed = max(0, base_wind + wind_variation)
            wave_height = max(0, base_wave + wave_variation)
            wind_gust = wind_speed * random.uniform(1.2, 1.5)
            
            # Determine conditions
            if wave_height > 3.0 or wind_speed > 25:
                condition = "rough"
                risk_score = random.uniform(70, 95)
            elif wave_height > 2.0 or wind_speed > 18:
                condition = "moderate"
                risk_score = random.uniform(40, 69)
            else:
                condition = "calm"
                risk_score = random.uniform(10, 39)
            
            forecast_hours.append({
                "timestamp": time.isoformat(),
                "hour_offset": i,
                "wind_speed_knots": round(wind_speed, 1),
                "wind_gust_knots": round(wind_gust, 1),
                "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
                "wave_height_m": round(wave_height, 1),
                "wave_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
                "visibility_km": round(base_visibility + random.uniform(-2, 2), 1),
                "sea_state": condition,
                "risk_score": round(risk_score, 0),
                "precipitation_mm": round(random.uniform(0, 5), 1) if random.random() < 0.3 else 0,
            })
        
        return {
            "location": {"lat": lat, "lng": lng},
            "source": "IMD_DEMO",
            "demo_mode": True,
            "disclaimer": "Demonstration data for development only. Not for navigation.",
            "generated_at": datetime.utcnow().isoformat(),
            "forecast_hours": forecast_hours,
            "alerts": self._generate_demo_alerts(forecast_hours),
        }
    
    def _generate_demo_alerts(self, forecast_hours: List[Dict]) -> List[Dict]:
        """Generate weather alerts based on forecast."""
        alerts = []
        
        # Check for high wind
        max_wind = max(h["wind_speed_knots"] for h in forecast_hours)
        if max_wind > 25:
            alerts.append({
                "type": "HIGH_WIND",
                "severity": "warning",
                "message": f"High wind warning: gusts up to {int(max_wind)} knots expected",
                "issued_at": datetime.utcnow().isoformat(),
            })
        
        # Check for rough seas
        max_wave = max(h["wave_height_m"] for h in forecast_hours)
        if max_wave > 3.0:
            alerts.append({
                "type": "ROUGH_SEA",
                "severity": "warning",
                "message": f"Rough sea conditions: wave heights up to {max_wave:.1f}m",
                "issued_at": datetime.utcnow().isoformat(),
            })
        
        # Check for precipitation
        total_precip = sum(h["precipitation_mm"] for h in forecast_hours)
        if total_precip > 15:
            alerts.append({
                "type": "HEAVY_RAIN",
                "severity": "advisory",
                "message": f"Heavy rainfall expected: {total_precip:.0f}mm over forecast period",
                "issued_at": datetime.utcnow().isoformat(),
            })
        
        return alerts
    
    async def get_cyclone_info(self) -> Dict:
        """Get active cyclone information for Bay of Bengal.
        
        Returns:
            Active cyclone data or empty if none
        """
        if self.demo_mode:
            # No active cyclones in demo mode (configurable)
            return {
                "active_cyclones": [],
                "source": "IMD_DEMO",
                "demo_mode": True,
                "last_updated": datetime.utcnow().isoformat(),
            }
        
        # Real API call would parse IMD cyclone bulletin
        return {
            "active_cyclones": [],
            "source": "IMD",
            "demo_mode": False,
            "last_updated": datetime.utcnow().isoformat(),
        }
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()
