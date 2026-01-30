import { useGeolocation } from '../hooks/useGeolocation';
import { MapPin, Play, Square } from 'lucide-react';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TripTracker({ onTripEnd }) {
  const { tracking, distance, duration, start, stop, error } = useGeolocation();

  const handleStop = () => {
    const result = stop();
    onTripEnd({
      id: Date.now(),
      date: new Date().toLocaleDateString('fi-FI'),
      startTime: result.startTime,
      endTime: result.endTime,
      distance: result.distance,
      duration: result.duration,
      type: 'unclassified',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!tracking ? (
        <button
          onClick={start}
          className="w-40 h-40 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white flex flex-col items-center justify-center gap-2 shadow-lg transition-colors"
        >
          <Play size={40} />
          <span className="text-lg font-semibold">Aloita matka</span>
        </button>
      ) : (
        <>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <MapPin size={18} className="animate-pulse text-green-500" />
              <span className="text-sm">Seuranta käynnissä</span>
            </div>
            <div className="text-5xl font-mono font-bold">{distance.toFixed(2)} km</div>
            <div className="text-2xl font-mono text-gray-600">{formatDuration(duration)}</div>
          </div>
          <button
            onClick={handleStop}
            className="w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex flex-col items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <Square size={32} />
            <span className="font-semibold">Lopeta</span>
          </button>
        </>
      )}
    </div>
  );
}
