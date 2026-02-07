import { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPin, Play, Square } from 'lucide-react';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TripTracker({ onTripEnd, profiles }) {
  const { tracking, distance, duration, start, stop, error } = useGeolocation();
  const [choosingProfile, setChoosingProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const handleStartClick = () => {
    if (profiles && profiles.length > 1) {
      setChoosingProfile(true);
    } else {
      setSelectedProfile(profiles?.[0] || 'Yleinen');
      start();
    }
  };

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    setChoosingProfile(false);
    start();
  };

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
      profile: selectedProfile || 'Yleinen',
      startAddress: '',
      endAddress: '',
    });
    setSelectedProfile(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {choosingProfile ? (
        <div className="w-full max-w-xs space-y-3">
          <h3 className="text-center font-semibold text-gray-700">Mille profiilille tämä ajo kirjataan?</h3>
          {profiles.map((p) => (
            <button
              key={p}
              onClick={() => handleProfileSelect(p)}
              className="w-full py-3 px-4 bg-white rounded-xl shadow text-left font-medium hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setChoosingProfile(false)}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            Peruuta
          </button>
        </div>
      ) : !tracking ? (
        <button
          onClick={handleStartClick}
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
            {selectedProfile && (
              <div className="text-xs text-gray-400">Profiili: {selectedProfile}</div>
            )}
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
