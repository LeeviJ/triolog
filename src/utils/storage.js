const KEY = 'triolog_trips';

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
