#!/bin/bash
cd /Users/sivasubramanian/Desktop/kaapaan
cd backend && source venv/bin/activate && cd .. && python run_backend.py &
sleep 3
cd frontend && npm run dev
