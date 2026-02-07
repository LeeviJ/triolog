/**
 * TrioLog PDF Report Generator
 *
 * Generates a driving logbook (ajopäiväkirja) PDF report from trip data.
 * Uses the browser's built-in print functionality for PDF creation
 * without requiring external dependencies.
 */

import { getRates } from './storage'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('.')
  if (parts.length === 3) return dateStr
  const d = new Date(dateStr)
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

const typeLabels = {
  unclassified: 'Luokittelematon',
  work: 'Työajo',
  private: 'Yksityinen',
}

/**
 * Generate a PDF report of trips (ajopäiväkirja).
 *
 * @param {Array} trips - Array of trip objects from storage
 * @param {Object} settings - User settings (for km rates etc.)
 * @param {Object} options - Optional filters
 * @param {string} options.profile - Filter by profile name
 * @param {string} options.type - Filter by trip type ('work' | 'private')
 * @param {string} options.startDate - Start date filter (ISO string)
 * @param {string} options.endDate - End date filter (ISO string)
 */
export function generateTripPDF(trips, settings, options = {}) {
  let filtered = [...trips]

  if (options.profile) {
    filtered = filtered.filter((t) => (t.profile || 'Yleinen') === options.profile)
  }
  if (options.type) {
    filtered = filtered.filter((t) => t.type === options.type)
  }
  if (options.startDate) {
    filtered = filtered.filter((t) => t.id >= new Date(options.startDate).getTime())
  }
  if (options.endDate) {
    filtered = filtered.filter((t) => t.id <= new Date(options.endDate).getTime() + 86400000)
  }

  const rates = getRates(settings)
  const totalKm = filtered.reduce((sum, t) => sum + (t.distance || 0), 0)
  const workTrips = filtered.filter((t) => t.type === 'work')
  const workKm = workTrips.reduce((sum, t) => sum + (t.distance || 0), 0)
  const compensation = workKm * rates.km

  const now = new Date()
  const reportDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`

  const html = `
<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8">
  <title>Ajopäiväkirja — TrioLog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #1a1a1a; padding: 20mm; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; padding: 12px 16px; background: #f5f5f5; border-radius: 8px; }
    .summary-item { }
    .summary-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; padding: 8px 12px; border-bottom: 2px solid #e5e5e5; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
    tr:nth-child(even) { background: #fafafa; }
    .type-work { color: #1d4ed8; font-weight: 600; }
    .type-private { color: #b45309; font-weight: 600; }
    .type-unclassified { color: #666; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e5e5; color: #aaa; font-size: 10px; display: flex; justify-content: space-between; }
    @media print { body { padding: 10mm; } }
  </style>
</head>
<body>
  <h1>Ajopäiväkirja</h1>
  <div class="subtitle">Raportti luotu ${reportDate} — TrioLog</div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Matkat yhteensä</div>
      <div class="summary-value">${filtered.length} kpl</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Kilometrit yhteensä</div>
      <div class="summary-value">${totalKm.toFixed(1)} km</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Työajot</div>
      <div class="summary-value">${workKm.toFixed(1)} km</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Km-korvaus (${rates.km} €/km)</div>
      <div class="summary-value">${compensation.toFixed(2)} €</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Pvm</th>
        <th>Tyyppi</th>
        <th>Profiili</th>
        <th>Matka (km)</th>
        <th>Kesto</th>
      </tr>
    </thead>
    <tbody>
      ${filtered
        .map(
          (t) => `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td class="type-${t.type}">${typeLabels[t.type] || t.type}</td>
          <td>${t.profile || 'Yleinen'}</td>
          <td>${t.distance.toFixed(2)}</td>
          <td>${formatDuration(t.duration)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <span>TrioLog — ajopäiväkirja ja kuittien hallinta</span>
    <span>leevi.latvatalo@gmail.com</span>
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Salli ponnahdusikkunat tässä selaimessa, jotta PDF voidaan luoda.')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
