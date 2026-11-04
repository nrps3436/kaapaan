"""SQLAlchemy models for KAAPPAAN."""
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Fisherman(Base):
    __tablename__ = "fishermen"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    vessel = Column(String, nullable=False)
    phone = Column(String)
    status = Column(String, default="safe")  # safe | warning | critical | sos
    created_at = Column(DateTime, default=datetime.utcnow)


class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    fisherman_id = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed_knots = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    battery_pct = Column(Integer, default=100)
    signal_strength = Column(Integer, default=90)
    timestamp = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    fisherman_id = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    severity = Column(String, default="warning")
    message = Column(Text)
    zone_id = Column(String, nullable=True)
    distance_km = Column(Float, nullable=True)
    time_to_boundary_min = Column(Float, nullable=True)
    acknowledged = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


class SOSEvent(Base):
    __tablename__ = "sos_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    fisherman_id = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    message = Column(Text)
    status = Column(String, default="active")  # active | acknowledged | resolved
    priority = Column(String, default="critical")
    acknowledged_by = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
