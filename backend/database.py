"""Database setup and seeding for KAAPPAAN."""
import math
import random
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from .models import Base, Fisherman, Location

DB_PATH = Path(__file__).parent.parent / "kaapaan.db"
ENGINE = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)

# Simulated starting positions — Bay of Bengal near Tamil Nadu coast
DEMO_FISHERMEN = [
    {"id": "KPP-001", "name": "Murugan Selvam", "vessel": "Vel Murugan-1", "phone": "+91-9441100001",
     "lat": 9.9312, "lng": 79.8300, "heading": 45},
    {"id": "KPP-002", "name": "Rajan Krishnan", "vessel": "Selva Ganesh", "phone": "+91-9441100002",
     "lat": 10.1850, "lng": 80.2100, "heading": 120},
    {"id": "KPP-003", "name": "Anbu Chelvan", "vessel": "Kadalamma-3", "phone": "+91-9441100003",
     "lat": 9.7500, "lng": 79.6500, "heading": 200},
    {"id": "KPP-004", "name": "Senthil Kumar", "vessel": "Meenakshi Amman", "phone": "+91-9441100004",
     "lat": 10.3200, "lng": 80.5500, "heading": 330},
    {"id": "KPP-005", "name": "Durai Pandian", "vessel": "Arul Jothi-2", "phone": "+91-9441100005",
     "lat": 9.5800, "lng": 79.3200, "heading": 90},
]

# Geofence zones (simulated — not official maritime borders)
GEOFENCE_ZONES = [
    {"id": "z1", "name": "Restricted Zone Alpha", "center_lat": 10.5, "center_lng": 80.2, "radius_km": 25,
     "zone_type": "exclusion", "description": "Simulated exclusion zone for demo"},
    {"id": "z2", "name": "Warning Zone Beta", "center_lat": 10.0, "center_lng": 80.8, "radius_km": 35,
     "zone_type": "warning", "description": "Simulated warning zone for demo"},
    {"id": "z3", "name": "Caution Zone Gamma", "center_lat": 9.6, "center_lng": 79.5, "radius_km": 20,
     "zone_type": "restricted", "description": "Simulated restricted zone for demo"},
]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def compute_status(lat: float, lng: float, speed_knots: float, heading: float) -> tuple[str, list[dict]]:
    """Compute fisherman status and any alerts based on geofence proximity."""
    alerts = []
    worst_status = "safe"

    for zone in GEOFENCE_ZONES:
        dist = haversine_km(lat, lng, zone["center_lat"], zone["center_lng"])
        dist_to_boundary = dist - zone["radius_km"]

        # Speed in km/h (1 knot = 1.852 km/h)
        speed_kmh = speed_knots * 1.852
        time_to_boundary = (dist_to_boundary / speed_kmh * 60) if speed_kmh > 0 and dist_to_boundary > 0 else None

        if dist_to_boundary < 0:
            # Inside the zone — critical
            severity = "critical"
            msg = f"INSIDE {zone['name']} ({zone['zone_type'].upper()}). Simulated zone — exit immediately."
            worst_status = "critical"
        elif dist_to_boundary < 10:
            severity = "critical"
            msg = f"Critically close to {zone['name']}: {dist_to_boundary:.1f} km from boundary (simulated zone)."
            worst_status = "critical"
        elif dist_to_boundary < 20:
            severity = "warning"
            msg = f"Approaching {zone['name']}: {dist_to_boundary:.1f} km from boundary (simulated zone)."
            if worst_status == "safe":
                worst_status = "warning"
        else:
            continue

        alerts.append({
            "alert_type": f"GEOFENCE_{zone['zone_type'].upper()}",
            "severity": severity,
            "message": msg,
            "zone_id": zone["id"],
            "distance_km": round(dist_to_boundary, 2),
            "time_to_boundary_min": round(time_to_boundary, 1) if time_to_boundary else None,
        })

    return worst_status, alerts


def init_db():
    """Create tables and seed demo data if empty."""
    Base.metadata.create_all(bind=ENGINE)
    db = SessionLocal()
    try:
        existing = db.query(Fisherman).count()
        if existing == 0:
            for f in DEMO_FISHERMEN:
                fisherman = Fisherman(
                    id=f["id"], name=f["name"], vessel=f["vessel"],
                    phone=f["phone"], status="safe"
                )
                db.add(fisherman)
                loc = Location(
                    fisherman_id=f["id"],
                    lat=f["lat"], lng=f["lng"],
                    speed_knots=round(random.uniform(3.0, 8.0), 1),
                    heading=f["heading"],
                    battery_pct=random.randint(70, 100),
                    signal_strength=random.randint(70, 95),
                    timestamp=datetime.utcnow(),
                )
                db.add(loc)
            db.commit()
    finally:
        db.close()
