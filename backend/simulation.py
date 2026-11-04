"""GPS simulation engine for KAAPPAAN."""
import math
import random
from datetime import datetime

from sqlalchemy.orm import Session

from .database import DEMO_FISHERMEN, compute_status
from .models import Alert, Fisherman, Location


def _move(lat: float, lng: float, heading: float, speed_knots: float, dt_hours: float = 1 / 1200) -> tuple[float, float]:
    """Move a point along a heading by speed * dt."""
    dist_km = speed_knots * 1.852 * dt_hours
    R = 6371.0
    dlat = (dist_km / R) * math.cos(math.radians(heading))
    dlng = (dist_km / R) * math.sin(math.radians(heading)) / math.cos(math.radians(lat))
    return lat + math.degrees(dlat), lng + math.degrees(dlng)


def simulation_step(db: Session) -> int:
    """Advance simulation one step — move fishermen, update statuses, generate alerts."""
    fishermen = db.query(Fisherman).all()
    updated = 0

    for f in fishermen:
        # Get latest location
        loc = db.query(Location).filter_by(fisherman_id=f.id).order_by(Location.timestamp.desc()).first()
        if not loc:
            continue

        # Update movement
        heading_drift = random.uniform(-15, 15)
        new_heading = (loc.heading + heading_drift) % 360
        speed_change = random.uniform(-1.0, 1.0)
        new_speed = max(1.0, min(12.0, loc.speed_knots + speed_change))
        battery_drain = random.randint(0, 2)
        new_battery = max(5, loc.battery_pct - battery_drain)
        signal = random.randint(60, 100)

        new_lat, new_lng = _move(loc.lat, loc.lng, new_heading, new_speed)

        # Keep within Bay of Bengal bounds (approx)
        new_lat = max(8.5, min(11.5, new_lat))
        new_lng = max(78.5, min(81.5, new_lng))

        # Compute geofence status
        status, zone_alerts = compute_status(new_lat, new_lng, new_speed, new_heading)

        # Occasionally add SOS for demo realism (very low probability)
        if f.status != "sos" and random.random() < 0.01:
            status = "sos"
            zone_alerts.append({
                "alert_type": "SOS_AUTO",
                "severity": "sos",
                "message": f"Automated SOS from {f.name} — emergency beacon activated (simulated).",
                "zone_id": None,
                "distance_km": None,
                "time_to_boundary_min": None,
            })

        # Save new location
        new_loc = Location(
            fisherman_id=f.id, lat=new_lat, lng=new_lng,
            speed_knots=round(new_speed, 1), heading=round(new_heading, 1),
            battery_pct=new_battery, signal_strength=signal,
            timestamp=datetime.utcnow(),
        )
        db.add(new_loc)

        # Save alerts
        for a in zone_alerts:
            db.add(Alert(
                fisherman_id=f.id,
                alert_type=a["alert_type"],
                severity=a["severity"],
                message=a["message"],
                zone_id=a.get("zone_id"),
                distance_km=a.get("distance_km"),
                time_to_boundary_min=a.get("time_to_boundary_min"),
                timestamp=datetime.utcnow(),
            ))

        f.status = status
        updated += 1

    db.commit()
    return updated


def reset_simulation(db: Session):
    """Reset all fishermen to their original positions."""
    db.query(Location).delete()
    db.query(Alert).delete()
    db.query(Fisherman).update({"status": "safe"})

    for f in DEMO_FISHERMEN:
        import random as _r
        db.add(Location(
            fisherman_id=f["id"], lat=f["lat"], lng=f["lng"],
            speed_knots=round(_r.uniform(3.0, 8.0), 1),
            heading=f["heading"],
            battery_pct=_r.randint(70, 100),
            signal_strength=_r.randint(70, 95),
            timestamp=datetime.utcnow(),
        ))
    db.commit()
