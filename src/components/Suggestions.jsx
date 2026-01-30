import { Check, X } from 'lucide-react';

export default function Suggestions({ suggestions, onAccept, onReject }) {
  const pending = suggestions.filter(s => s.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-sm text-gray-500">Ehdotukset</h3>
      {pending.map((s) => (
        <div key={s.id} className="bg-white rounded-xl shadow p-4 space-y-3">
          <div>
            <div className="font-semibold">{s.storeName}</div>
            <div className="text-sm text-gray-500">
              {new Date(s.receiptTime).toLocaleString('fi-FI')}
            </div>
            <div className="text-sm mt-1">
              {s.type === 'classify'
                ? `Kävitkö ${s.storeName}? Merkitäänkö työajoksi?`
                : `Lisätäänkö matka kohteeseen ${s.storeName}?`}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(s.id)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Check size={16} /> Hyväksy
            </button>
            <button
              onClick={() => onReject(s.id)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <X size={16} /> Hylkää
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
