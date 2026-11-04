"""KAAPPAAN Strands AI Safety Agent — real Bedrock calls with deterministic fallback."""
import json
import logging
import os
from datetime import datetime
from typing import Any

# Strands imports
try:
    from strands import Agent, tool
    from strands.models import BedrockModel
    STRANDS_AVAILABLE = True
except ImportError:
    STRANDS_AVAILABLE = False

logger = logging.getLogger(__name__)

MODEL_ID = os.environ.get("SHIP_MODEL", "us.amazon.nova-2-lite-v1:0")
REGION = os.environ.get("AWS_REGION", "us-east-1")
AWS_PROFILE = os.environ.get("AWS_PROFILE", "new-account")

# Tamil safety messages — local, no translation API needed
TAMIL_MESSAGES = {
    "high": "அபாயகரமான நிலை! தயவுசெய்து கரைக்கு திரும்பவும். தட்டுவளைவு பகுதியை விட்டு வெளியேறுங்கள்.",
    "medium": "எச்சரிக்கை! கட்டுப்பாட்டு மண்டலத்திற்கு அருகில் உள்ளீர்கள். கவனமாக செல்லவும்.",
    "low": "நிலை சாதாரணம். பாதுகாப்பாக தொடரவும். வானிலை மாற்றங்களை கவனிக்கவும்.",
    "critical": "மிகவும் அபாயகரமான நிலை! உடனடியாக கரைக்கு திரும்பவும். SOS அனுப்பவும்.",
}

# Hard-coded safety thresholds (code owns these, model cannot change them)
THRESHOLDS = {
    "critical_distance_km": 10.0,
    "warning_distance_km": 25.0,
    "critical_battery_pct": 20,
    "warning_battery_pct": 40,
    "max_safe_speed_knots": 15.0,
    "sos_auto_trigger_battery": 10,
}


@tool
def assess_geofence_risk(fisherman_id: str, lat: float, lng: float,
                          speed_knots: float, heading: float) -> dict:
    """Assess geofence risk for a fisherman based on their current position.

    Args:
        fisherman_id: Unique fisherman identifier
        lat: Current latitude
        lng: Current longitude
        speed_knots: Current speed in knots
        heading: Current heading in degrees

    Returns:
        Risk assessment with zones, distances, and recommended actions
    """
    import math

    ZONES = [
        {"id": "z1", "name": "Restricted Zone Alpha", "lat": 10.5, "lng": 80.2, "radius_km": 25},
        {"id": "z2", "name": "Warning Zone Beta", "lat": 10.0, "lng": 80.8, "radius_km": 35},
        {"id": "z3", "name": "Caution Zone Gamma", "lat": 9.6, "lng": 79.5, "radius_km": 20},
    ]

    def haversine(lat1, lng1, lat2, lng2):
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
        return R * 2 * math.asin(math.sqrt(a))

    zone_risks = []
    overall_risk = "low"

    for zone in ZONES:
        dist = haversine(lat, lng, zone["lat"], zone["lng"])
        dist_to_boundary = dist - zone["radius_km"]
        speed_kmh = speed_knots * 1.852
        time_to_boundary = (dist_to_boundary / speed_kmh * 60) if speed_kmh > 0 and dist_to_boundary > 0 else 0

        if dist_to_boundary < THRESHOLDS["critical_distance_km"]:
            risk = "critical"
            overall_risk = "critical"
        elif dist_to_boundary < THRESHOLDS["warning_distance_km"]:
            risk = "high"
            if overall_risk == "low":
                overall_risk = "high"
        elif dist_to_boundary < 50:
            risk = "medium"
            if overall_risk == "low":
                overall_risk = "medium"
        else:
            risk = "low"

        zone_risks.append({
            "zone_id": zone["id"],
            "zone_name": zone["name"],
            "distance_km": round(dist_to_boundary, 1),
            "time_to_boundary_min": round(time_to_boundary, 0),
            "risk": risk,
        })

    return {
        "fisherman_id": fisherman_id,
        "overall_risk": overall_risk,
        "zone_risks": zone_risks,
        "thresholds_used": THRESHOLDS,
        "assessment_time": datetime.utcnow().isoformat(),
        "disclaimer": "These are simulated zones for demo purposes, not official maritime boundaries.",
    }


@tool
def analyse_fisherman_safety(fisherman_id: str, name: str, battery_pct: int,
                              signal_strength: int, speed_knots: float, status: str) -> dict:
    """Analyse overall safety status for a fisherman including device health.

    Args:
        fisherman_id: Unique fisherman identifier
        name: Fisherman's name
        battery_pct: Battery percentage (0-100)
        signal_strength: Signal strength percentage (0-100)
        speed_knots: Current speed in knots
        status: Current status (safe/warning/critical/sos)

    Returns:
        Safety analysis with risk factors and recommended actions
    """
    risk_factors = []
    actions = []
    risk_level = "low"

    # Hard-coded thresholds — code controls these, not the model
    if battery_pct <= THRESHOLDS["sos_auto_trigger_battery"]:
        risk_factors.append(f"CRITICAL: Battery at {battery_pct}% — SOS auto-trigger threshold reached")
        actions.append("Return to shore immediately — battery critical")
        risk_level = "critical"
    elif battery_pct <= THRESHOLDS["critical_battery_pct"]:
        risk_factors.append(f"Battery very low: {battery_pct}%")
        actions.append("Head back to shore to recharge")
        risk_level = "high" if risk_level == "low" else risk_level
    elif battery_pct <= THRESHOLDS["warning_battery_pct"]:
        risk_factors.append(f"Battery getting low: {battery_pct}%")
        actions.append("Monitor battery level closely")
        risk_level = "medium" if risk_level == "low" else risk_level

    if signal_strength < 40:
        risk_factors.append(f"Weak signal: {signal_strength}%")
        actions.append("Move closer to shore or communication relay")
        risk_level = "medium" if risk_level in ("low",) else risk_level

    if speed_knots > THRESHOLDS["max_safe_speed_knots"]:
        risk_factors.append(f"Unusually high speed: {speed_knots} knots")
        actions.append("Check vessel speed and stability")

    if status == "sos":
        risk_level = "critical"
        actions.insert(0, "RESPOND TO SOS IMMEDIATELY — dispatch rescue team")

    if not risk_factors:
        risk_factors.append("All systems nominal")
        actions.append("Maintain current course and check in every 2 hours")

    return {
        "fisherman_id": fisherman_id,
        "name": name,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "actions": actions,
        "battery_status": "critical" if battery_pct <= THRESHOLDS["critical_battery_pct"] else "ok",
        "signal_status": "weak" if signal_strength < 40 else "ok",
    }


def _deterministic_fallback(fishermen_data: list[dict]) -> dict:
    """Rule-based fallback when Bedrock is unavailable. Clearly labelled."""
    recommendations = []
    for f in fishermen_data:
        loc = f.get("location", {})
        if not loc:
            continue

        # Use the tool functions directly (they're pure Python, no LLM needed)
        geo = assess_geofence_risk.__wrapped__(
            fisherman_id=f["id"],
            lat=loc.get("lat", 10.0), lng=loc.get("lng", 80.0),
            speed_knots=loc.get("speed_knots", 5.0),
            heading=loc.get("heading", 0.0),
        )
        safety = analyse_fisherman_safety.__wrapped__(
            fisherman_id=f["id"], name=f["name"],
            battery_pct=loc.get("battery_pct", 80),
            signal_strength=loc.get("signal_strength", 80),
            speed_knots=loc.get("speed_knots", 5.0),
            status=f["status"],
        )

        risk = safety["risk_level"] if safety["risk_level"] != "low" else geo["overall_risk"]
        msg = (f"[Deterministic fallback — Bedrock unavailable] {f['name']} is at "
               f"{loc.get('lat', 0):.3f}°N, {loc.get('lng', 0):.3f}°E. "
               f"Battery: {loc.get('battery_pct', 0)}%. Signal: {loc.get('signal_strength', 0)}%. "
               f"Geofence risk: {geo['overall_risk']}. ")
        if geo["zone_risks"]:
            closest = min(geo["zone_risks"], key=lambda z: z["distance_km"])
            msg += f"Closest zone: {closest['zone_name']} at {closest['distance_km']} km."

        recommendations.append({
            "fisherman_id": f["id"],
            "fisherman_name": f["name"],
            "risk_level": risk,
            "message": msg,
            "actions": safety["actions"],
            "tamil_summary": TAMIL_MESSAGES.get(risk, TAMIL_MESSAGES["low"]),
        })

    return {
        "model_id": "deterministic-fallback",
        "region": REGION,
        "last_run": datetime.utcnow().isoformat(),
        "status": "fallback",
        "recommendations": recommendations,
        "fallback": True,
    }


def run_safety_analysis(fishermen_data: list[dict]) -> dict:
    """Run the Strands AI safety agent. Falls back to deterministic if Bedrock fails."""
    if not STRANDS_AVAILABLE:
        logger.warning("Strands not available, using deterministic fallback")
        return _deterministic_fallback(fishermen_data)

    try:
        import boto3
        session = boto3.Session(profile_name=AWS_PROFILE, region_name=REGION)
        bedrock = session.client("bedrock-runtime")
        # Quick connectivity test
        bedrock.meta.endpoint_url  # noqa: just checks the client exists

        model = BedrockModel(
            model_id=MODEL_ID,
            region_name=REGION,
            boto_session=session,
            temperature=0.3,
        )

        agent = Agent(
            model=model,
            tools=[assess_geofence_risk, analyse_fisherman_safety],
            system_prompt=(
                "You are a maritime safety analyst for KAAPPAAN, a fisherman safety platform "
                "covering the Bay of Bengal near Tamil Nadu, India. "
                "Analyse each fisherman's telemetry and geofence proximity. "
                "For each fisherman, call assess_geofence_risk and analyse_fisherman_safety tools, "
                "then provide a concise safety recommendation. "
                "NOTE: All geofence zones are SIMULATED for demonstration purposes only. "
                "Keep each recommendation under 3 sentences."
            ),
            callback_handler=None,
        )

        # Build the prompt with current telemetry
        telemetry_summary = []
        for f in fishermen_data:
            loc = f.get("location", {})
            if loc:
                telemetry_summary.append(
                    f"{f['id']} ({f['name']}): lat={loc.get('lat', 0):.4f}, "
                    f"lng={loc.get('lng', 0):.4f}, speed={loc.get('speed_knots', 0):.1f} knots, "
                    f"battery={loc.get('battery_pct', 0)}%, signal={loc.get('signal_strength', 0)}%, "
                    f"status={f['status']}"
                )

        prompt = (
            "Analyse the following fishermen and provide safety recommendations. "
            "Use the available tools to assess each one.\n\n"
            + "\n".join(telemetry_summary)
        )

        response = agent(prompt)
        response_text = str(response)

        # Build structured recommendations from tool outputs + AI text
        recommendations = []
        for f in fishermen_data:
            loc = f.get("location", {})
            if not loc:
                continue

            geo = assess_geofence_risk.__wrapped__(
                fisherman_id=f["id"],
                lat=loc.get("lat", 10.0), lng=loc.get("lng", 80.0),
                speed_knots=loc.get("speed_knots", 5.0),
                heading=loc.get("heading", 0.0),
            )
            safety = analyse_fisherman_safety.__wrapped__(
                fisherman_id=f["id"], name=f["name"],
                battery_pct=loc.get("battery_pct", 80),
                signal_strength=loc.get("signal_strength", 80),
                speed_knots=loc.get("speed_knots", 5.0),
                status=f["status"],
            )

            risk = safety["risk_level"] if safety["risk_level"] != "low" else geo["overall_risk"]
            # Extract AI message for this fisherman if present
            ai_msg = ""
            lines = response_text.split("\n")
            for i, line in enumerate(lines):
                if f["id"] in line or f["name"] in line:
                    ai_msg = " ".join(lines[i:i+3]).strip()[:300]
                    break
            if not ai_msg:
                ai_msg = f"AI analysis complete. Risk level: {risk}. {' '.join(safety['risk_factors'][:2])}"

            recommendations.append({
                "fisherman_id": f["id"],
                "fisherman_name": f["name"],
                "risk_level": risk,
                "message": ai_msg,
                "actions": safety["actions"],
                "tamil_summary": TAMIL_MESSAGES.get(risk, TAMIL_MESSAGES["low"]),
            })

        return {
            "model_id": MODEL_ID,
            "region": REGION,
            "last_run": datetime.utcnow().isoformat(),
            "status": "ok",
            "recommendations": recommendations,
            "fallback": False,
        }

    except Exception as e:
        logger.warning(f"Bedrock agent failed ({e}), using deterministic fallback")
        result = _deterministic_fallback(fishermen_data)
        result["error"] = str(e)
        return result
