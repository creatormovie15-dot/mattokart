import React, { useState } from 'react';
import { MapPin, X, Check, Search, ShieldCheck } from 'lucide-react';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';
import { SaharanpurLocality } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocality: SaharanpurLocality;
  onSelectLocality: (locality: SaharanpurLocality) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  selectedLocality,
  onSelectLocality,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const filtered = SAHARANPUR_LOCALITIES.filter(
    (loc) =>
      (loc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.pinCode || '').includes(searchTerm) ||
      (loc.areaType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = customPin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPinError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    // Check if it's within Saharanpur range (usually 247xxx)
    const isLocalSaharanpur = cleanPin.startsWith('247');
    const customLoc: SaharanpurLocality = {
      name: isLocalSaharanpur ? `Saharanpur Area (${cleanPin})` : `Location PIN: ${cleanPin}`,
      pinCode: cleanPin,
      areaType: isLocalSaharanpur ? 'Urban Market' : 'Sub-division / Tehsil',
    };
    onSelectLocality(customLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Select Your Delivery Area</h3>
              <p className="text-xs text-slate-600">MattoKart serves Saharanpur & neighbouring tehsils</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick PIN Code Entry */}
          <form onSubmit={handleCustomPinSubmit} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Enter 6-Digit PIN Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={customPin}
                onChange={(e) => {
                  setCustomPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                placeholder="e.g. 247001 (Saharanpur)"
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                Apply PIN
              </button>
            </div>
            {pinError && <p className="text-xs text-red-500 font-medium">{pinError}</p>}
          </form>

          {/* Search Localities */}
          <div className="pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search market or locality (e.g. Court Road, Deoband)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>
          </div>

          {/* Localities List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold uppercase tracking-wider">
              <span>Popular Saharanpur Hubs</span>
              <span className="flex items-center gap-1 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> Direct Local Delivery
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {filtered.map((loc) => {
                const isSelected =
                  Boolean(selectedLocality) &&
                  selectedLocality.name === loc.name &&
                  selectedLocality.pinCode === loc.pinCode;

                return (
                  <button
                    key={`${loc.name}-${loc.pinCode}`}
                    onClick={() => {
                      onSelectLocality(loc);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium text-slate-900 group-hover:text-orange-900">
                          {loc.name}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                            PIN {loc.pinCode}
                          </span>
                          <span>•</span>
                          <span>{loc.areaType}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
          <span>Delivery timeline varies by locality & shop</span>
          <span className="font-medium text-orange-700">Saharanpur Hub</span>
        </div>
      </div>
    </div>
  );
};
