import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api/client'

export function useSimulation() {
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = useCallback(async () => {
    try {
      await api.runSimStep()
      setTick(t => t + 1)
    } catch (e) {
      console.error('sim step error', e)
    }
  }, [])

  const start = useCallback(() => {
    setRunning(true)
    intervalRef.current = setInterval(step, 3000)
  }, [step])

  const pause = useCallback(() => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const reset = useCallback(async () => {
    pause()
    await api.resetSimulation()
    setTick(t => t + 1)
  }, [pause])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return { running, tick, start, pause, reset }
}
