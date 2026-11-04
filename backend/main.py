"""KAAPPAAN FastAPI backend — Maritime Safety Platform."""
import logging
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db, init_db, GEOFENCE_ZONES
from .models import Alert, Fisherman, Location, SOSEvent
from .simulation import reset_simulation, simulation_step

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kaapaan")

app = FastAPI(title="KAAPPAAN Maritime Safety API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()
    logger.info("KAAPPAAN backend started — database seeded")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class LocationIn(BaseModel):
    fisherman_id: str
    lat: float
    lng: float
    speed_knots: float = 0.0
    heading: float = 0.0
    battery_pct: int = 100
    signal_strength: int = 90


class SOSIn(BaseModel):
    fisherman_id: str
    lat: float
    lng: float
    message: str = "Emergency SOS"


class SOSUpdate(BaseModel):
    status: str
    acknowledged_by: Optional[str] = None


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    fishermen = db.query(Fisherman).all()
    return {
        "total_fishermen": len(fishermen),
        "active_devices": len([f for f in fishermen if f.status != "sos"]),
        "safe": len([f for f in fishermen if f.status == "safe"]),
        "warning": len([f for f in fishermen if f.status == "warning"]),
        "critical": len([f for f in fishermen if f.status == "critical"]),
        "sos": len([f for f in fishermen if f.status == "sos"]),
    }


# ── Fishermen ─────────────────────────────────────────────────────────────────

@app.get("/api/fishermen")
def get_fishermen(db: Session = Depends(get_db)):
    fishermen = db.query(Fisherman).all()
    result = []
    for f in fishermen:
        loc = db.query(Location).filter_by(fisherman_id=f.id).order_by(Location.timestamp.desc()).first()
        entry = {
            "id": f.id, "name": f.name, "vessel": f.vessel,
            "phone": f.phone, "status": f.status,
        }
        if loc:
            entry["location"] = {
                "fisherman_id": loc.fisherman_id,
                "lat": loc.lat, "lng": loc.lng,
                "speed_knots": loc.speed_knots, "heading": loc.heading,
                "battery_pct": loc.battery_pct, "signal_strength": loc.signal_strength,
                "timestamp": loc.timestamp.isoformat(),
            }
        result.append(entry)
    return result


# ── Locations ─────────────────────────────────────────────────────────────────

@app.get("/api/locations/latest")
def get_latest_locations(db: Session = Depends(get_db)):
    fishermen = db.query(Fisherman).all()
    result = []
    for f in fishermen:
        loc = db.query(Location).filter_by(fisherman_id=f.id).order_by(Location.timestamp.desc()).first()
        if loc:
            result.append({
                "fisherman_id": f.id,
                "lat": loc.lat, "lng": loc.lng,
                "speed_knots": loc.speed_knots, "heading": loc.heading,
                "battery_pct": loc.battery_pct, "signal_strength": loc.signal_strength,
                "timestamp": loc.timestamp.isoformat(),
            })
    return result


# ── Telemetry ─────────────────────────────────────────────────────────────────

@app.post("/api/telemetry")
def post_telemetry(locations: list[LocationIn], db: Session = Depends(get_db)):
    from .database import compute_status
    for loc_in in locations:
        f = db.query(Fisherman).filter_by(id=loc_in.fisherman_id).first()
        if not f:
            continue
        loc = Location(
            fisherman_id=loc_in.fisherman_id, lat=loc_in.lat, lng=loc_in.lng,
            speed_knots=loc_in.speed_knots, heading=loc_in.heading,
            battery_pct=loc_in.battery_pct, signal_strength=loc_in.signal_strength,
            timestamp=datetime.utcnow(),
        )
        db.add(loc)
        status, alerts = compute_status(loc_in.lat, loc_in.lng, loc_in.speed_knots, loc_in.heading)
        f.status = status
        for a in alerts:
            db.add(Alert(fisherman_id=f.id, **a, timestamp=datetime.utcnow()))
    db.commit()
    return {"updated": len(locations)}


# ── Alerts ────────────────────────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(100).all()
    return [
        {
            "id": a.id, "fisherman_id": a.fisherman_id,
            "alert_type": a.alert_type, "severity": a.severity,
            "message": a.message, "zone_id": a.zone_id,
            "distance_km": a.distance_km, "time_to_boundary_min": a.time_to_boundary_min,
            "acknowledged": a.acknowledged, "timestamp": a.timestamp.isoformat(),
        }
        for a in alerts
    ]


@app.patch("/api/alerts/{alert_id}")
def ack_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter_by(id=alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    db.commit()
    return {"ok": True}


# ── SOS ───────────────────────────────────────────────────────────────────────

@app.get("/api/sos")
def get_sos(db: Session = Depends(get_db)):
    events = db.query(SOSEvent).order_by(SOSEvent.timestamp.desc()).all()
    return [
        {
            "id": e.id, "fisherman_id": e.fisherman_id,
            "lat": e.lat, "lng": e.lng, "message": e.message,
            "status": e.status, "priority": e.priority,
            "acknowledged_by": e.acknowledged_by,
            "timestamp": e.timestamp.isoformat(),
            "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None,
        }
        for e in events
    ]


@app.post("/api/sos")
def create_sos(data: SOSIn, db: Session = Depends(get_db)):
    f = db.query(Fisherman).filter_by(id=data.fisherman_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fisherman not found")

    event = SOSEvent(
        fisherman_id=data.fisherman_id,
        lat=data.lat, lng=data.lng,
        message=data.message,
        status="active", priority="critical",
        timestamp=datetime.utcnow(),
    )
    db.add(event)
    f.status = "sos"
    db.add(Alert(
        fisherman_id=data.fisherman_id,
        alert_type="SOS_TRIGGERED",
        severity="sos",
        message=f"SOS triggered: {data.message}",
        timestamp=datetime.utcnow(),
    ))
    db.commit()
    db.refresh(event)
    return {
        "id": event.id, "fisherman_id": event.fisherman_id,
        "lat": event.lat, "lng": event.lng, "message": event.message,
        "status": event.status, "priority": event.priority,
        "acknowledged_by": event.acknowledged_by,
        "timestamp": event.timestamp.isoformat(),
        "resolved_at": None,
    }


@app.patch("/api/sos/{sos_id}")
def update_sos(sos_id: int, data: SOSUpdate, db: Session = Depends(get_db)):
    event = db.query(SOSEvent).filter_by(id=sos_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="SOS event not found")

    event.status = data.status
    if data.acknowledged_by:
        event.acknowledged_by = data.acknowledged_by
    if data.status == "resolved":
        event.resolved_at = datetime.utcnow()
        # Update fisherman status back to safe if no other active SOS
        other_sos = db.query(SOSEvent).filter(
            SOSEvent.fisherman_id == event.fisherman_id,
            SOSEvent.status == "active",
            SOSEvent.id != sos_id,
        ).first()
        if not other_sos:
            f = db.query(Fisherman).filter_by(id=event.fisherman_id).first()
            if f and f.status == "sos":
                f.status = "safe"
    db.commit()
    db.refresh(event)
    return {
        "id": event.id, "fisherman_id": event.fisherman_id,
        "lat": event.lat, "lng": event.lng, "message": event.message,
        "status": event.status, "priority": event.priority,
        "acknowledged_by": event.acknowledged_by,
        "timestamp": event.timestamp.isoformat(),
        "resolved_at": event.resolved_at.isoformat() if event.resolved_at else None,
    }


# ── AI Agent ──────────────────────────────────────────────────────────────────

@app.get("/api/agents/status")
def get_agent_status(db: Session = Depends(get_db)):
    """Run the Strands AI safety agent and return recommendations."""
    from .ai_agent import run_safety_analysis

    fishermen = db.query(Fisherman).all()
    fishermen_data = []
    for f in fishermen:
        loc = db.query(Location).filter_by(fisherman_id=f.id).order_by(Location.timestamp.desc()).first()
        entry = {"id": f.id, "name": f.name, "vessel": f.vessel, "status": f.status}
        if loc:
            entry["location"] = {
                "lat": loc.lat, "lng": loc.lng,
                "speed_knots": loc.speed_knots, "heading": loc.heading,
                "battery_pct": loc.battery_pct, "signal_strength": loc.signal_strength,
            }
        fishermen_data.append(entry)

    result = run_safety_analysis(fishermen_data)
    return result


# ── Simulation ────────────────────────────────────────────────────────────────

@app.post("/api/simulation/step")
def sim_step(db: Session = Depends(get_db)):
    updated = simulation_step(db)
    return {"updated": updated}


@app.post("/api/simulation/reset")
def sim_reset(db: Session = Depends(get_db)):
    reset_simulation(db)
    return {"ok": True}


# ── Geofence zones (for frontend) ────────────────────────────────────────────

@app.get("/api/geofences")
def get_geofences():
    return GEOFENCE_ZONES


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "KAAPPAAN Maritime Safety API", "timestamp": datetime.utcnow().isoformat()}

# ── Weather Routes ────────────────────────────────────────────────────────────

from .weather.imd_service import IMDWeatherService
from .routes.planner import RoutePlanner

# Initialize weather services (demo mode = True for development)
weather_service = IMDWeatherService(demo_mode=True)
route_planner = RoutePlanner(weather_service)


@app.get("/api/weather/forecast")
async def get_weather_forecast(lat: float, lng: float, hours: int = 24):
    """Get marine weather forecast for location.
    
    Query params:
        lat: Latitude
        lng: Longitude
        hours: Forecast hours (6, 12, 24, 48, 72)
    """
    try:
        forecast = await weather_service.get_marine_forecast(lat, lng, hours)
        return forecast
    except Exception as e:
        logger.error(f"Weather forecast error: {e}")
        raise HTTPException(status_code=500, detail=f"Weather service error: {str(e)}")


@app.get("/api/weather/cyclone")
async def get_cyclone_info():
    """Get active cyclone information for Bay of Bengal."""
    try:
        cyclone_data = await weather_service.get_cyclone_info()
        return cyclone_data
    except Exception as e:
        logger.error(f"Cyclone info error: {e}")
        raise HTTPException(status_code=500, detail=f"Cyclone service error: {str(e)}")


class RoutePlanRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    vessel_speed_knots: float = 6.0
    departure_time: Optional[str] = None


@app.post("/api/routes/plan")
async def plan_route(request: RoutePlanRequest):
    """Plan a weather-aware route from start to end.
    
    Body:
        start_lat, start_lng: Starting position
        end_lat, end_lng: Destination
        vessel_speed_knots: Average vessel speed (default 6 knots)
        departure_time: ISO timestamp (optional, defaults to now)
    """
    try:
        departure = None
        if request.departure_time:
            departure = datetime.fromisoformat(request.departure_time.replace('Z', '+00:00'))
        
        route = await route_planner.plan_route(
            request.start_lat, request.start_lng,
            request.end_lat, request.end_lng,
            request.vessel_speed_knots,
            departure
        )
        return route
    except Exception as e:
        logger.error(f"Route planning error: {e}")
        raise HTTPException(status_code=500, detail=f"Route planning error: {str(e)}")


@app.get("/api/weather/config")
def get_weather_config():
    """Get weather service configuration and mode."""
    return {
        "demo_mode": weather_service.demo_mode,
        "sources": {
            "imd": "India Meteorological Department",
            "incois": "Indian National Centre for Ocean Information Services (future)",
            "fallback": "Demonstration mode with synthetic data"
        },
        "update_interval_minutes": 180,  # 3 hours
        "disclaimer": "Weather data is for planning purposes only. Always check official marine bulletins before departure."
    }
