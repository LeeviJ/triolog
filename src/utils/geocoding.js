/**
 * Geocoding utility for TrioLog.
 *
 * Reverse geocoding: convert GPS coordinates to street addresses.
 * Ready for integration with a map service (e.g. OpenStreetMap Nominatim, Google Maps, HERE).
 */

// --- Automaatio-valmius: Aseta API-avain kun karttapalvelu kytketään päälle ---
// const GEOCODING_API_KEY = import.meta.env.VITE_GEOCODING_API_KEY || ''
// -----------------------------------------------------------------------------

/**
 * Fetch a human-readable address from GPS coordinates.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} Street address or empty string on failure
 *
 * TODO: Kytke oikea karttapalvelu päälle:
 *
 * Vaihtoehto 1 — OpenStreetMap Nominatim (ilmainen, rate-limited):
 *   const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=fi`
 *
 * Vaihtoehto 2 — HERE Maps:
 *   const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&lang=fi&apiKey=${GEOCODING_API_KEY}`
 *
 * Vaihtoehto 3 — Google Maps:
 *   const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=fi&key=${GEOCODING_API_KEY}`
 */
export async function fetchAddressFromCoords(lat, lon) {
  // Placeholder: palauta tyhjä kunnes karttapalvelu on kytketty
  // Poista tämä rivi ja ota käyttöön alla oleva koodi:
  return ''

  // --- Oikea toteutus (Nominatim-esimerkki): ---
  // try {
  //   const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=fi`
  //   const res = await fetch(url, {
  //     headers: { 'User-Agent': 'TrioLog/1.0 (leevi.latvatalo@gmail.com)' },
  //   })
  //   if (!res.ok) return ''
  //   const data = await res.json()
  //   const a = data.address
  //   if (!a) return data.display_name || ''
  //   const road = a.road || a.pedestrian || a.path || ''
  //   const number = a.house_number || ''
  //   const city = a.city || a.town || a.village || a.municipality || ''
  //   return [road, number, city].filter(Boolean).join(' ').trim()
  // } catch {
  //   return ''
  // }
}
