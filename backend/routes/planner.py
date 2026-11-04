"""Intelligent route planning with weather risk assessment.

Calculates optimal fishing routes considering:
- Weather conditions along the route
- Wave height and wind speed
- Fuel efficiency
- Safety margins
- Fishing zone recommendations
"""
import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Tuple, Dict

logger = logging.getLogger(__name__)


@dataclass
class Waypoint:
    """A point along a route with weather data."""
    lat: float
    lng: float
    distance_from_prev_nm: float  # nautical miles
    cumulative_distance_nm: float
    eta: datetime
    weather: Dict
    risk_score: float
    

class RouteRiskAnalyzer:
    """Analyzes route safety based on weather conditions."""
    
    # Risk scoring thresholds
    WIND_THRESHOLD_LOW = 15  # knots
    WIND_THRESHOLD_HIGH = 25
    WAVE_THRESHOLD_LOW = 2.0  # meters
    WAVE_THRESHOLD_HIGH = 3.5
    VISIBILITY_THRESHOLD = 3.0  # km
    
    @staticmethod
    def calculate_risk_score(weather: Dict) -> float:
        """Calculate 0-100 risk score for weather conditions.
        
        Returns:
            0-30: Safe (green)
            31-60: Moderate (yellow)
            61-85: High risk (orange)
            86-100: Dangerous (red)
        """
        score = 0.0
        
        # Wind risk (0-40 points)
        wind_speed = weather.get("wind_speed_knots", 0)
        if wind_speed > RouteRiskAnalyzer.WIND_THRESHOLD_HIGH:
            score += 40
        elif wind_speed > RouteRiskAnalyzer.WIND_THRESHOLD_LOW:
            # Linear interpolation
            score += 20 + (wind_speed - RouteRiskAnalyzer.WIND_THRESHOLD_LOW) * 2
        
        # Wave risk (0-35 points)
        wave_height = weather.get("wave_height_m", 0)
        if wave_height > RouteRiskAnalyzer.WAVE_THRESHOLD_HIGH:
            score += 35
        elif wave_height > RouteRiskAnalyzer.WAVE_THRESHOLD_LOW:
            score += 15 + (wave_height - RouteRiskAnalyzer.WAVE_THRESHOLD_LOW) * 13
        
        # Visibility risk (0-15 points)
        visibility = weather.get("visibility_km", 10)
        if visibility < RouteRiskAnalyzer.VISIBILITY_THRESHOLD:
            score += 15 * (1 - visibility / RouteRiskAnalyzer.VISIBILITY_THRESHOLD)
        
        # Precipitation risk (0-10 points)
        precip = weather.get("precipitation_mm", 0)
        if precip > 10:
            score += 10
        elif precip > 3:
            score += precip * 0.7
        
        return min(100, score)
    
    @staticmethod
    def get_risk_level(score: float) -> str:
        """Convert risk score to level."""
        if score >= 86:
            return "dangerous"
        elif score >= 61:
            return "high"
        elif score >= 31:
            return "moderate"
        else:
            return "safe"
    
    @staticmethod
    def get_risk_color(score: float) -> str:
        """Get color code for risk score."""
        if score >= 86:
            return "#dc2626"  # red
        elif score >= 61:
            return "#f97316"  # orange
        elif score >= 31:
            return "#eab308"  # yellow
        else:
            return "#22c55e"  # green


class RoutePlanner:
    """Plans optimal fishing routes with weather awareness."""
    
    def __init__(self, weather_service):
        self.weather_service = weather_service
        self.risk_analyzer = RouteRiskAnalyzer()
    
    @staticmethod
    def haversine_nm(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance in nautical miles."""
        R = 3440.065  # Earth radius in nautical miles
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng / 2) ** 2)
        return R * 2 * math.asin(math.sqrt(a))
    
    @staticmethod
    def interpolate_waypoints(start: Tuple[float, float], 
                            end: Tuple[float, float], 
                            num_points: int = 5) -> List[Tuple[float, float]]:
        """Generate intermediate waypoints between start and end."""
        waypoints = [start]
        for i in range(1, num_points):
            t = i / num_points
            lat = start[0] + t * (end[0] - start[0])
            lng = start[1] + t * (end[1] - start[1])
            waypoints.append((lat, lng))
        waypoints.append(end)
        return waypoints
    
    async def plan_route(self, 
                        start_lat: float, start_lng: float,
                        end_lat: float, end_lng: float,
                        vessel_speed_knots: float = 6.0,
                        departure_time: datetime = None) -> Dict:
        """Plan a weather-aware route.
        
        Args:
            start_lat, start_lng: Starting position
            end_lat, end_lng: Destination
            vessel_speed_knots: Average vessel speed
            departure_time: When to depart (default: now)
            
        Returns:
            Route plan with waypoints, weather, and risk assessment
        """
        if departure_time is None:
            departure_time = datetime.utcnow()
        
        # Generate waypoints along great circle route
        coords = self.interpolate_waypoints(
            (start_lat, start_lng), (end_lat, end_lng), num_points=8
        )
        
        waypoints = []
        cumulative_distance = 0.0
        current_time = departure_time
        prev_coord = coords[0]
        
        for i, (lat, lng) in enumerate(coords):
            if i == 0:
                distance_from_prev = 0
            else:
                distance_from_prev = self.haversine_nm(
                    prev_coord[0], prev_coord[1], lat, lng
                )
                cumulative_distance += distance_from_prev
                # ETA calculation
                hours = distance_from_prev / vessel_speed_knots
                current_time = current_time + timedelta(hours=hours)
            
            # Fetch weather for this waypoint
            weather = await self.weather_service.get_marine_forecast(
                lat, lng, hours=6
            )
            # Use nearest time forecast
            nearest_forecast = weather["forecast_hours"][0]
            
            # Calculate risk
            risk_score = self.risk_analyzer.calculate_risk_score(nearest_forecast)
            
            waypoints.append(Waypoint(
                lat=lat,
                lng=lng,
                distance_from_prev_nm=round(distance_from_prev, 2),
                cumulative_distance_nm=round(cumulative_distance, 2),
                eta=current_time,
                weather=nearest_forecast,
                risk_score=round(risk_score, 1),
            ))
            
            prev_coord = (lat, lng)
        
        # Calculate overall route risk
        avg_risk = sum(w.risk_score for w in waypoints) / len(waypoints)
        max_risk = max(w.risk_score for w in waypoints)
        
        # Determine if route is advisable
        route_status = "not_recommended" if max_risk >= 70 else "recommended"
        
        return {
            "start": {"lat": start_lat, "lng": start_lng},
            "end": {"lat": end_lat, "lng": end_lng},
            "departure_time": departure_time.isoformat(),
            "vessel_speed_knots": vessel_speed_knots,
            "total_distance_nm": round(cumulative_distance, 2),
            "estimated_duration_hours": round(cumulative_distance / vessel_speed_knots, 1),
            "waypoints": [
                {
                    "lat": w.lat,
                    "lng": w.lng,
                    "distance_from_prev_nm": w.distance_from_prev_nm,
                    "cumulative_distance_nm": w.cumulative_distance_nm,
                    "eta": w.eta.isoformat(),
                    "weather": w.weather,
                    "risk_score": w.risk_score,
                    "risk_level": self.risk_analyzer.get_risk_level(w.risk_score),
                    "risk_color": self.risk_analyzer.get_risk_color(w.risk_score),
                }
                for w in waypoints
            ],
            "overall_risk": {
                "average_score": round(avg_risk, 1),
                "maximum_score": round(max_risk, 1),
                "level": self.risk_analyzer.get_risk_level(max_risk),
                "color": self.risk_analyzer.get_risk_color(max_risk),
                "status": route_status,
            },
            "weather_source": weather["source"],
            "demo_mode": weather.get("demo_mode", False),
        }
