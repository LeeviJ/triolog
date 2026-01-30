import { useState, useEffect } from 'react';
import { MapPin, List } from 'lucide-react';
import TripTracker from './components/TripTracker';
import TripList from './components/TripList';
import { loadTrips, saveTrips } from './utils/storage';

export default function App() {
  const [tab, setTab] = useState('track');
  const [trips, setTrips] = useState(() => loadTrips());

  useEffect(() => {
    saveTrips(trips);
  }, [trips]);

  const handleTripEnd = (trip) => {
    setTrips((prev) => [trip, ...prev]);
    setTab('list');
  };

  const handleUpdateType = (id, type) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, type } : t))
    );
  };

  const handleDelete = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <header className="bg-white shadow-sm px-4 py-3 text-center font-bold text-lg">
        TrioLog
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === 'track' ? (
          <TripTracker onTripEnd={handleTripEnd} />
        ) : (
          <TripList trips={trips} onUpdate={handleUpdateType} onDelete={handleDelete} />
        )}
      </main>

      <nav className="bg-white border-t flex">
        <button
          onClick={() => setTab('track')}
          className={`flex-1 flex flex-col items-center py-3 text-sm font-medium transition-colors ${
            tab === 'track' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <MapPin size={20} />
          Seuranta
        </button>
        <button
          onClick={() => setTab('list')}
          className={`flex-1 flex flex-col items-center py-3 text-sm font-medium transition-colors ${
            tab === 'list' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <List size={20} />
          Matkat
        </button>
      </nav>
    </div>
  );
}
