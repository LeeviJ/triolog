import { useState } from 'react';
import { Briefcase, User, Trash2, Filter, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

const typeLabels = {
  unclassified: 'Luokittelematon',
  work: 'Työajo',
  private: 'Yksityinen',
};

const typeColors = {
  unclassified: 'bg-gray-100 text-gray-600',
  work: 'bg-blue-100 text-blue-700',
  private: 'bg-amber-100 text-amber-700',
};

export default function TripList({ trips, onUpdate, onDelete, onUpdateTrip, profiles }) {
  const [filterProfile, setFilterProfile] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = filterProfile === 'all'
    ? trips
    : trips.filter((t) => (t.profile || 'Yleinen') === filterProfile);

  const handleAddressChange = (id, field, value) => {
    if (onUpdateTrip) {
      onUpdateTrip(id, { [field]: value });
    }
  };

  return (
    <div className="space-y-3 p-4">
      {/* Profile filter */}
      {profiles && profiles.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <button
            onClick={() => setFilterProfile('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterProfile === 'all' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Kaikki
          </button>
          {profiles.map((p) => (
            <button
              key={p}
              onClick={() => setFilterProfile(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterProfile === p ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          Ei tallennettuja matkoja
        </div>
      ) : (
        filtered.map((trip) => (
          <div key={trip.id} className="bg-white rounded-xl shadow p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{trip.date}</div>
                <div className="text-sm text-gray-500">
                  {trip.distance.toFixed(2)} km &middot; {formatDuration(trip.duration)}
                </div>
                {trip.profile && trip.profile !== 'Yleinen' && (
                  <div className="text-xs text-purple-600 mt-0.5">{trip.profile}</div>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColors[trip.type]}`}>
                {typeLabels[trip.type]}
              </span>
            </div>

            {/* Address summary (collapsed) */}
            {(trip.startAddress || trip.endAddress) && expandedId !== trip.id && (
              <div className="flex items-start gap-1.5 text-xs text-gray-400">
                <MapPin size={12} className="shrink-0 mt-0.5" />
                <span className="truncate">
                  {trip.startAddress || '?'} → {trip.endAddress || '?'}
                </span>
              </div>
            )}

            {/* Expand/collapse toggle */}
            <button
              onClick={() => setExpandedId(expandedId === trip.id ? null : trip.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MapPin size={12} />
              {expandedId === trip.id ? 'Piilota osoitteet' : 'Muokkaa osoitteita'}
              {expandedId === trip.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Expanded address fields */}
            {expandedId === trip.id && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lähtöosoite</label>
                  <input
                    type="text"
                    value={trip.startAddress || ''}
                    onChange={(e) => handleAddressChange(trip.id, 'startAddress', e.target.value)}
                    placeholder="esim. Kotikatu 5, Joensuu"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Saapumisosoite</label>
                  <input
                    type="text"
                    value={trip.endAddress || ''}
                    onChange={(e) => handleAddressChange(trip.id, 'endAddress', e.target.value)}
                    placeholder="esim. Torikatu 21, Joensuu"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onUpdate(trip.id, 'work')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  trip.type === 'work'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                }`}
              >
                <Briefcase size={14} /> Työajo
              </button>
              <button
                onClick={() => onUpdate(trip.id, 'private')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  trip.type === 'private'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-amber-100'
                }`}
              >
                <User size={14} /> Yksityinen
              </button>
              <button
                onClick={() => onDelete(trip.id)}
                className="ml-auto px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
