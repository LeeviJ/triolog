import { useState, useEffect, useRef } from 'react';
import { MapPin, List, Receipt, Menu, Download, Upload, Plus, X, Mail } from 'lucide-react';
import TripTracker from './components/TripTracker';
import TripList from './components/TripList';
import ReceiptScanner from './components/ReceiptScanner';
import Suggestions from './components/Suggestions';
import {
  loadTrips, saveTrips,
  loadSuggestions, saveSuggestions,
  loadSettings, saveSettings,
  exportBackup, importBackup,
  getRates, sendBackupByEmail,
} from './utils/storage';
import { receiptTimeToTimestamp } from './utils/receiptParser';

const MATCH_WINDOW_MS = 30 * 60 * 1000;

export default function App() {
  const [tab, setTab] = useState('track');
  const [trips, setTrips] = useState(() => loadTrips());
  const [suggestions, setSuggestions] = useState(() => loadSuggestions());
  const [settings, setSettings] = useState(() => loadSettings());
  const [importMsg, setImportMsg] = useState(null);
  const [newProfile, setNewProfile] = useState('');
  const importRef = useRef(null);

  useEffect(() => { saveTrips(trips); }, [trips]);
  useEffect(() => { saveSuggestions(suggestions); }, [suggestions]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const prevTripsLen = useRef(trips.length);
  useEffect(() => {
    if (settings.autoEmailBackup && settings.backupEmail && trips.length > prevTripsLen.current) {
      sendBackupByEmail(settings.backupEmail);
    }
    prevTripsLen.current = trips.length;
  }, [trips, settings.autoEmailBackup, settings.backupEmail]);

  const rates = getRates(settings);
  const profiles = settings.profiles || ['Yleinen'];

  const handleTripEnd = (trip) => {
    setTrips((prev) => [trip, ...prev]);
    setTab('list');
  };

  const handleUpdateType = (id, type) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, type } : t)));
  };

  const handleDelete = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const handleReceiptScanned = (parsed) => {
    const receiptTs = receiptTimeToTimestamp(parsed.date, parsed.time);
    if (!receiptTs) return;

    const matchedTrip = trips.find(
      (t) => t.endTime && Math.abs(t.endTime - receiptTs) <= MATCH_WINDOW_MS
    );

    const suggestion = {
      id: Date.now(),
      type: matchedTrip ? 'classify' : 'proposed_trip',
      tripId: matchedTrip?.id ?? null,
      storeName: parsed.storeName || 'Tuntematon',
      receiptTime: receiptTs,
      ocrRawText: parsed.raw || '',
      proposedTrip: matchedTrip ? null : {
        id: Date.now() + 1,
        date: parsed.date,
        startTime: receiptTs - 15 * 60 * 1000,
        endTime: receiptTs,
        distance: 0,
        duration: 900,
        type: 'work',
        profile: settings.activeProfile || 'Yleinen',
        storeName: parsed.storeName,
        address: parsed.address,
      },
      status: 'pending',
    };

    setSuggestions((prev) => [suggestion, ...prev]);
  };

  const handleAcceptSuggestion = (id) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'accepted' } : s))
    );
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion) return;

    if (suggestion.type === 'classify' && suggestion.tripId) {
      handleUpdateType(suggestion.tripId, 'work');
    } else if (suggestion.type === 'proposed_trip' && suggestion.proposedTrip) {
      setTrips((prev) => [suggestion.proposedTrip, ...prev]);
    }
  };

  const handleRejectSuggestion = (id) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
  };

  const handleToggle2025 = () => {
    setSettings((prev) => ({ ...prev, use2025Rates: !prev.use2025Rates }));
  };

  const handleAddProfile = () => {
    const name = newProfile.trim();
    if (!name || profiles.includes(name)) return;
    setSettings((prev) => ({ ...prev, profiles: [...prev.profiles, name] }));
    setNewProfile('');
  };

  const handleRemoveProfile = (name) => {
    if (name === 'Yleinen') return;
    setSettings((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p !== name),
      activeProfile: prev.activeProfile === name ? 'Yleinen' : prev.activeProfile,
    }));
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importBackup(file);
      setTrips(data.trips || []);
      setSuggestions(data.suggestions || []);
      if (data.settings) setSettings(data.settings);
      setImportMsg('Varmuuskopio palautettu onnistuneesti!');
    } catch (err) {
      setImportMsg(err.message);
    }
    if (importRef.current) importRef.current.value = '';
    setTimeout(() => setImportMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <header className="bg-white shadow-sm px-4 py-3 text-center font-bold text-lg">
        TrioLog
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === 'track' && (
          <TripTracker onTripEnd={handleTripEnd} profiles={profiles} />
        )}
        {tab === 'list' && (
          <TripList
            trips={trips}
            onUpdate={handleUpdateType}
            onDelete={handleDelete}
            profiles={profiles}
          />
        )}
        {tab === 'receipts' && (
          <>
            <ReceiptScanner onReceiptScanned={handleReceiptScanned} />
            <Suggestions
              suggestions={suggestions}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
            />
          </>
        )}
        {tab === 'menu' && (
          <div className="p-4 space-y-4">
            {/* Profiles */}
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              <h3 className="font-semibold">Ajoprofiilit</h3>
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div key={p} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">{p}</span>
                    {p !== 'Yleinen' && (
                      <button
                        onClick={() => handleRemoveProfile(p)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProfile}
                  onChange={(e) => setNewProfile(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                  placeholder="Uusi profiili..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleAddProfile}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* 2025 rates toggle */}
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              <h3 className="font-semibold">Verohallinnon korvaukset</h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Käytä vuoden 2025 korvauksia</span>
                <div
                  onClick={handleToggle2025}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.use2025Rates ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.use2025Rates ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Kilometrikorvaus: {rates.km.toFixed(2).replace('.', ',')} €/km</div>
                <div>Kokopäiväraha: {rates.fullDay} €</div>
                <div>Osapäiväraha: {rates.halfDay} €</div>
              </div>
            </div>

            {/* Email backup settings */}
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              <h3 className="font-semibold">Sähköpostivarmuuskopio</h3>
              <label className="block text-sm text-gray-600">
                Sähköpostiosoite
              </label>
              <input
                type="email"
                value={settings.backupEmail || ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, backupEmail: e.target.value }))}
                placeholder="nimi@esimerkki.fi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Lähetä automaattisesti tallennuksen yhteydessä</span>
                <div
                  onClick={() => setSettings((prev) => ({ ...prev, autoEmailBackup: !prev.autoEmailBackup }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoEmailBackup ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      settings.autoEmailBackup ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
              <p className="text-xs text-gray-400">
                Kun kytkin on päällä, varmuuskopio lähetetään sähköpostiin aina kun uusi matka tallentuu.
              </p>
            </div>

            {/* Backup */}
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              <h3 className="font-semibold">Varmuuskopiointi</h3>
              <div className="flex gap-2">
                <button
                  onClick={exportBackup}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  <Download size={16} /> Lataa varmuuskopio
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer">
                  <Upload size={16} /> Palauta varmuuskopio
                  <input
                    ref={importRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
              <button
                onClick={() => {
                  const email = settings.backupEmail;
                  if (!email) { setImportMsg('Aseta ensin sähköpostiosoite yllä.'); setTimeout(() => setImportMsg(null), 3000); return; }
                  sendBackupByEmail(email);
                }}
                className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                <Mail size={16} /> Lähetä nyt sähköpostiin
              </button>
              {importMsg && (
                <div className="text-sm text-green-600 text-center">{importMsg}</div>
              )}
              <p className="text-xs text-gray-400 leading-relaxed">
                Vinkki: Kun olet skannannut kuitit, lataa varmuuskopio ja tallenna se pilveen
                tai lähetä itsellesi sähköpostilla. Näin tiedot säilyvät varmasti tallessa.
              </p>
            </div>
          </div>
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
        <button
          onClick={() => setTab('receipts')}
          className={`flex-1 flex flex-col items-center py-3 text-sm font-medium transition-colors ${
            tab === 'receipts' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <Receipt size={20} />
          Kuitit
        </button>
        <button
          onClick={() => setTab('menu')}
          className={`flex-1 flex flex-col items-center py-3 text-sm font-medium transition-colors ${
            tab === 'menu' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <Menu size={20} />
          Valikko
        </button>
      </nav>
    </div>
  );
}
