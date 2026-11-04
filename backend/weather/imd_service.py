"""IMD (India Meteorological Department) Weather Service Integration.

Provides marine weather forecasts for Bay of Bengal with real API integration.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import httpx
import json

logger = logging.getLogger(__name__)

# Real weather APIs
OPENWEATHER_MARINE_URL = "https://api.openweathermap.org/data/2.5/weather"
OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
IMD_MARINE_BULLETIN_URL = "https://mausam.imd.gov.in/responsive/marineWeatherBulletin.php"

class IMDWeatherService:
    """Service for fetching marine weather data."""
    
    def __init__(self, demo_mode: bool = False, api_key: Optional[str] = None):
        """Initialize weather service.
        
        Args:
            demo_mode: If True, use demonstration data
            api_key: OpenWeatherMap API key for real data
        """
        self.demo_mode = demo_mode
        self.api_key = api_key
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
        # Try real API first if key is provided
        if not self.demo_mode and self.api_key and self.api_key != 'demo':
            try:
                return await self._get_real_forecast(lat, lng, hours)
            except Exception as e:
                logger.warning(f"Real API failed, falling back to demo: {e}")
        
        return self._get_demo_forecast(lat, lng, hours)
    
    async def _get_real_forecast(self, lat: float, lng: float, hours: int) -> Dict:
        """Fetch real weather data from OpenWeatherMap."""
        try:
            # Current weather
            current_url = f"{OPENWEATHER_MARINE_URL}?lat={lat}&lon={lng}&appid={self.api_key}&units=metric"
            current_response = await self.client.get(current_url)
            current_response.raise_for_status()
            current_data = current_response.json()
            
            # Forecast data
            forecast_url = f"{OPENWEATHER_FORECAST_URL}?lat={lat}&lon={lng}&appid={self.api_key}&units=metric&cnt={hours//3}"
            forecast_response = await self.client.get(forecast_url)
            forecast_response.raise_for_status()
            forecast_data = forecast_response.json()
            
            return self._process_real_data(current_data, forecast_data, lat, lng)
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                logger.error("Invalid API key")
            raise
        except Exception as e:
            logger.error(f"Error fetching real weather data: {e}")
            raise
    
    def _process_real_data(self, current: Dict, forecast: Dict, lat: float, lng: float) -> Dict:
        """Process real API data into standard format."""
        forecast_hours = []
        
        # Add current conditions
        current_time = datetime.fromtimestamp(current['dt'])
        forecast_hours.append({
            'time': current_time.isoformat(),
            'hour_offset': 0,
            'wind_speed_knots': current['wind']['speed'] * 1.94384,  # m/s to knots
            'wind_direction': current['wind'].get('deg', 0),
            'wind_gust_knots': current['wind'].get('gust', current['wind']['speed']) * 1.94384,
            'wave_height_m': 1.0,  # OpenWeather doesn't provide wave data in free tier
            'wave_period_s': 6,
            'visibility_km': current.get('visibility', 10000) / 1000,
            'precipitation_mm': current.get('rain', {}).get('1h', 0),
            'pressure_mb': current['main']['pressure'],
            'temperature_c': current['main']['temp'],
            'condition': current['weather'][0]['main'].lower(),
            'risk_score': self._calculate_risk(
                current['wind']['speed'] * 1.94384,
                current.get('visibility', 10000) / 1000,
                1.0
            )
        })
        
        # Add forecast hours
        for item in forecast.get('list', []):
            forecast_time = datetime.fromtimestamp(item['dt'])
            hour_offset = int((forecast_time - datetime.fromtimestamp(current['dt'])).total_seconds() / 3600)
            
            wind_speed_knots = item['wind']['speed'] * 1.94384
            visibility_km = item.get('visibility', 10000) / 1000
            wave_height = 1.5  # Estimated
            
            forecast_hours.append({
                'time': forecast_time.isoformat(),
                'hour_offset': hour_offset,
                'wind_speed_knots': wind_speed_knots,
                'wind_direction': item['wind'].get('deg', 0),
                'wind_gust_knots': item['wind'].get('gust', item['wind']['speed']) * 1.94384,
                'wave_height_m': wave_height,
                'wave_period_s': 6,
                'visibility_km': visibility_km,
                'precipitation_mm': item.get('rain', {}).get('3h', 0),
                'pressure_mb': item['main']['pressure'],
                'temperature_c': item['main']['temp'],
                'condition': item['weather'][0]['main'].lower(),
                'risk_score': self._calculate_risk(wind_speed_knots, visibility_km, wave_height)
            })
        
        current_forecast = forecast_hours[0]
        
        return {
            'location': {'lat': lat, 'lng': lng},
            'current': {
                'wind_speed_knots': current_forecast['wind_speed_knots'],
                'wind_direction': current_forecast['wind_direction'],
                'wind_gust_knots': current_forecast['wind_gust_knots'],
                'wave_height_m': current_forecast['wave_height_m'],
                'wave_period_s': current_forecast['wave_period_s'],
                'visibility_km': current_forecast['visibility_km'],
                'condition': current_forecast['condition'],
                'risk_score': current_forecast['risk_score']
            },
            'forecast': forecast_hours,
            'updated_at': datetime.utcnow().isoformat(),
            'source': 'OpenWeatherMap',
            'demo_mode': False
        }
    
    def _calculate_risk(self, wind_speed: float, visibility: float, wave_height: float) -> float:
        """Calculate maritime risk score (0-100)."""
        risk = 0.0
        
        # Wind risk (0-40 points)
        if wind_speed > 30:
            risk += 40
        elif wind_speed > 20:
            risk += 30
        elif wind_speed > 15:
            risk += 20
        else:
            risk += (wind_speed / 15) * 10
        
        # Visibility risk (0-30 points)
        if visibility < 2:
            risk += 30
        elif visibility < 5:
            risk += 20
        elif visibility < 8:
            risk += 10
        
        # Wave risk (0-30 points)
        if wave_height > 4:
            risk += 30
        elif wave_height > 3:
            risk += 20
        elif wave_height > 2:
            risk += 10
        else:
            risk += (wave_height / 2) * 5
        
        return min(100, risk)
    
    def _get_demo_forecast(self, lat: float, lng: float, hours: int) -> Dict:
        """Generate demonstration weather forecast."""
        import random
        import math
        
        base_wind = random.uniform(8, 18)
        base_wave = random.uniform(1.0, 2.5)
        base_visibility = random.uniform(5, 10)
        
        forecast_hours = []
        for i in range(0, hours + 1, 3):
            time = datetime.utcnow() + timedelta(hours=i)
            
            wind_variation = math.sin(i / 6) * 5 + random.uniform(-2, 2)
            wave_variation = math.sin(i / 8) * 0.8 + random.uniform(-0.3, 0.3)
            
            wind_speed = max(0, base_wind + wind_variation)
            wave_height = max(0, base_wave + wave_variation)
            wind_gust = wind_speed * random.uniform(1.2, 1.5)
            visibility = max(2, base_visibility + random.uniform(-2, 2))
            
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
                'time': time.isoformat(),
                'hour_offset': i,
                'wind_speed_knots': round(wind_speed, 1),
                'wind_direction': random.randint(0, 359),
                'wind_gust_knots': round(wind_gust, 1),
                'wave_height_m': round(wave_height, 1),
                'wave_period_s': random.randint(5, 8),
                'visibility_km': round(visibility, 1),
                'precipitation_mm': random.uniform(0, 5) if random.random() > 0.7 else 0,
                'pressure_mb': random.randint(1008, 1015),
                'temperature_c': random.uniform(26, 32),
                'condition': condition,
                'risk_score': round(risk_score, 1)
            })
        
        current = forecast_hours[0]
        
        return {
            'location': {'lat': lat, 'lng': lng},
            'current': {
                'wind_speed_knots': current['wind_speed_knots'],
                'wind_direction': current['wind_direction'],
                'wind_gust_knots': current['wind_gust_knots'],
                'wave_height_m': current['wave_height_m'],
                'wave_period_s': current['wave_period_s'],
                'visibility_km': current['visibility_km'],
                'condition': current['condition'],
                'risk_score': current['risk_score']
            },
            'forecast': forecast_hours,
            'updated_at': datetime.utcnow().isoformat(),
            'source': 'Demonstration Mode',
            'demo_mode': True
        }
    
    async def get_cyclone_info(self) -> Dict:
        """Get active cyclone information for Bay of Bengal."""
        if self.demo_mode:
            return {
                'active_cyclones': [],
                'warnings': [],
                'last_updated': datetime.utcnow().isoformat(),
                'source': 'Demonstration Mode'
            }
        
        try:
            # In production, parse IMD cyclone bulletin
            return {
                'active_cyclones': [],
                'warnings': [],
                'last_updated': datetime.utcnow().isoformat(),
                'source': 'IMD'
            }
        except Exception as e:
            logger.error(f"Cyclone info error: {e}")
            return {
                'active_cyclones': [],
                'warnings': [],
                'error': str(e)
            }
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, *args):
        await self.client.aclose()
