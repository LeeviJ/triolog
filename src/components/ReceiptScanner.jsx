import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { parseReceipt } from '../utils/receiptParser';

export default function ReceiptScanner({ onReceiptScanned }) {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dateOverride, setDateOverride] = useState('');
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const worker = await createWorker('fin+eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseReceipt(text);
      // Apply date override if set
      if (dateOverride) {
        const d = new Date(dateOverride);
        parsed.date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
      }
      setResult(parsed);
      onReceiptScanned(parsed);
    } catch (err) {
      setError('OCR-käsittely epäonnistui: ' + err.message);
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDateOverride = (e) => {
    setDateOverride(e.target.value);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-600">
          Kuitin päivämäärä (valinnainen)
        </label>
        <input
          type="date"
          value={dateOverride}
          onChange={handleDateOverride}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400">
          Voit valita päivämäärän takautuvasti, esim. vuodelta 2025.
        </p>
      </div>

      <label className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-medium py-3 px-6 rounded-xl cursor-pointer transition-colors">
        {processing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Käsitellään...
          </>
        ) : (
          <>
            <Camera size={20} />
            Skannaa kuitti
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          disabled={processing}
          className="hidden"
        />
      </label>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-500">Kuitin tiedot</h3>
          {result.storeName && (
            <div className="text-lg font-bold">{result.storeName}</div>
          )}
          <div className="text-sm text-gray-600 space-y-1">
            {result.date && <div>Päivämäärä: {result.date}</div>}
            {result.time && <div>Aika: {result.time}</div>}
            {result.address && <div>Osoite: {result.address}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
