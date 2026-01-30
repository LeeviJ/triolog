const KEY = 'triolog_trips';
const SUGGESTIONS_KEY = 'triolog_suggestions';
const SETTINGS_KEY = 'triolog_settings';

const DEFAULT_SETTINGS = {
  use2025Rates: false,
  profiles: ['Yleinen', 'Ohjelmapalvelut', 'Maatalous', 'Metsätalous'],
  activeProfile: 'Yleinen',
};

export function loadTrips() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveTrips(trips) {
  localStorage.setItem(KEY, JSON.stringify(trips));
}

export function loadSuggestions() {
  try {
    return JSON.parse(localStorage.getItem(SUGGESTIONS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveSuggestions(suggestions) {
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
}

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    // Ensure profiles array always exists
    if (!Array.isArray(merged.profiles) || merged.profiles.length === 0) {
      merged.profiles = DEFAULT_SETTINGS.profiles;
    }
    if (!merged.activeProfile) {
      merged.activeProfile = merged.profiles[0];
    }
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportBackup() {
  const data = {
    trips: loadTrips(),
    suggestions: loadSuggestions(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  };
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const filename = `triolog_backup_${dd}${mm}${yy}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.trips) saveTrips(data.trips);
        if (data.suggestions) saveSuggestions(data.suggestions);
        if (data.settings) saveSettings(data.settings);
        resolve(data);
      } catch (err) {
        reject(new Error('Virheellinen varmuuskopiotiedosto'));
      }
    };
    reader.onerror = () => reject(new Error('Tiedoston luku epäonnistui'));
    reader.readAsText(file);
  });
}

export const RATES = {
  2025: { km: 0.53, fullDay: 51, halfDay: 24 },
  2026: { km: 0.55, fullDay: 53, halfDay: 25 },
};

export function getRates(settings) {
  return settings.use2025Rates ? RATES[2025] : RATES[2026];
}
