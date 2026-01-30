import { useState, useRef, useCallback } from 'react';
import { haversine } from '../utils/distance';

export function useGeolocation() {
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  const watchId = useRef(null);
  const lastPos = useRef(null);
  const totalDist = useRef(0);
  const timerRef = useRef(null);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation ei ole tuettu');
      return;
    }

    setError(null);
    totalDist.current = 0;
    lastPos.current = null;
    setDistance(0);
    const now = Date.now();
    setStartTime(now);
    setDuration(0);
    setTracking(true);

    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - now) / 1000));
    }, 1000);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPosition({ latitude, longitude });

        if (lastPos.current) {
          const d = haversine(
            lastPos.current.latitude,
            lastPos.current.longitude,
            latitude,
            longitude
          );
          if (d > 0.005) {
            totalDist.current += d;
            setDistance(totalDist.current);
            lastPos.current = { latitude, longitude };
          }
        } else {
          lastPos.current = { latitude, longitude };
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, []);

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTracking(false);
    const finalDuration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setDuration(finalDuration);
    return {
      distance: totalDist.current,
      duration: finalDuration,
      startTime,
      endTime: Date.now(),
    };
  }, [startTime]);

  return { tracking, distance, duration, start, stop, error, currentPosition };
}
