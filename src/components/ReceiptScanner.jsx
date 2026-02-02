import { useState, useRef } from 'react';
import { Camera, Loader2, Store } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { parseReceipt } from '../utils/receiptParser';

function preprocessImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 1500;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Increase contrast (factor 2.0, centered at 128)
        const contrasted = Math.min(255, Math.max(0, (gray - 128) * 2.0 + 128));

        // Apply threshold: black text on white background
        const final = contrasted < 140 ? 0 : 255;

        data[i] = final;
        data[i + 1] = final;
        data[i + 2] = final;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function ReceiptScanner({ onReceiptScanned, vendors = [], onSaveVendor }) {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dateOverride, setDateOverride] = useState('');
  const [vendorSaved, setVendorSaved] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError(null);
    setResult(null);
    setVendorSaved(false);

    try {
      const processedImage = await preprocessImage(file);
      const worker = await createWorker('fin+eng');
      const { data: { text } } = await worker.recognize(processedImage);
      await worker.terminate();

      const parsed = parseReceipt(text, vendors);
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
        <div className="space-y-3">
          {result.total && (
            <div className={`rounded-xl shadow p-4 text-center ${
              result.confidence === 'high' ? 'bg-green-50 border border-green-200' :
              result.confidence === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-orange-50 border border-orange-200'
            }`}>
              <div className="text-2xl font-bold">{result.total} €</div>
              <div className="text-sm text-gray-500 mt-1">
                {result.confidence === 'high' ? 'Tunnistettu summa' :
                 result.confidence === 'medium' ? 'Tunnistettu summa (tarkista)' :
                 'Paras arvaus summasta (tarkista)'}
                {' — Osuiko oikeaan?'}
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow p-4 space-y-2">
            <h3 className="font-semibold text-sm text-gray-500">Kuitin tiedot</h3>
            {result.storeName && (
              <div className="text-lg font-bold">
                {result.storeName}
                {result.matchedVendor && (
                  <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Tunnettu toimittaja</span>
                )}
              </div>
            )}
            <div className="text-sm text-gray-600 space-y-1">
              {result.date && <div>Päivämäärä: {result.date}</div>}
              {result.time && <div>Aika: {result.time}</div>}
              {result.total && <div>Summa: {result.total} €</div>}
              {result.matchedVendor?.address && <div>Osoite: {result.matchedVendor.address}</div>}
            </div>
            {!result.matchedVendor && result.storeName && onSaveVendor && !vendorSaved && (
              <button
                onClick={() => {
                  onSaveVendor({ name: result.storeName, businessId: '', address: '' });
                  setVendorSaved(true);
                }}
                className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Store size={16} /> Tallenna uutena toimittajana
              </button>
            )}
            {vendorSaved && (
              <div className="mt-2 text-sm text-green-600">Toimittaja tallennettu!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
