import React, { useState } from 'react';
import { MapPin, X, Check, Search, ShieldCheck, Globe2 } from 'lucide-react';
import { SAHARANPUR_LOCALITIES } from '../data/mockData';
import { INDIAN_STATES_UTS, resolveIndianPinMetadata } from '../data/indiaData';
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
  const [selectedStateName, setSelectedStateName] = useState(
    selectedLocality?.state || 'Uttar Pradesh'
  );

  if (!isOpen) return null;

  const activeStateObj =
    INDIAN_STATES_UTS.find((s) => s.name === selectedStateName) || INDIAN_STATES_UTS[0];

  const filtered = SAHARANPUR_LOCALITIES.filter(
    (loc) =>
      (loc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.pinCode || '').includes(searchTerm) ||
      (loc.areaType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = customPin.trim();
    const meta = resolveIndianPinMetadata(cleanPin);
    if (!meta.valid) {
      setPinError('Please enter a valid 6-digit Indian PIN code (e.g. 247001, 110001, 400001).');
      return;
    }
    const isLocalSaharanpur = cleanPin.startsWith('247');
    const customLoc: SaharanpurLocality = {
      name: isLocalSaharanpur ? `Saharanpur (${cleanPin})` : `${meta.cityLabel} (${cleanPin})`,
      city: isLocalSaharanpur ? 'Saharanpur' : meta.cityLabel,
      state: meta.state,
      pinCode: cleanPin,
      areaType: isLocalSaharanpur ? 'Urban Market' : 'Pan-India City',
    };
    onSelectLocality(customLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#091e3a] via-[#122b4e] to-[#091e3a] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f97316] text-white flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Choose Delivery Location Across India
              </h3>
              <p className="text-xs text-slate-300">
                Buy Anywhere. Sell Everywhere. · All 28 States &amp; 8 UTs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Quick PIN Code Entry */}
          <form onSubmit={handleCustomPinSubmit} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Enter Any 6-Digit Indian PIN Code
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
                placeholder="e.g. 247001, 110001, 400001, 560001"
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Apply PIN
              </button>
            </div>
            {pinError && <p className="text-xs text-red-500 font-medium">{pinError}</p>}
          </form>

          {/* Select Any State / UT & City */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-[#f97316]" />
                <span>Browse by Indian State / Union Territory</span>
              </span>
            </div>

            <select
              value={selectedStateName}
              onChange={(e) => setSelectedStateName(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {INDIAN_STATES_UTS.map((st) => (
                <option key={st.code + st.name} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeStateObj.majorDistricts.map((dist) => (
                <button
                  key={dist.samplePin + dist.name}
                  type="button"
                  onClick={() => {
                    onSelectLocality({
                      name: dist.name,
                      city: dist.name,
                      district: dist.name,
                      state: activeStateObj.name,
                      pinCode: dist.samplePin,
                      areaType: dist.name === 'Saharanpur' ? 'Urban Market' : 'Pan-India City',
                    });
                    onClose();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selectedLocality.pinCode === dist.samplePin
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-400 hover:text-orange-700'
                  }`}
                >
                  {dist.name} ({dist.samplePin})
                </button>
              ))}
            </div>
          </div>

          {/* Search Featured Saharanpur Starting Market Hubs */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Saharanpur starting market hubs..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold uppercase tracking-wider pt-1">
              <span>Featured Starting Hubs (Saharanpur, UP)</span>
              <span className="flex items-center gap-1 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> Express Local
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filtered.map((loc) => {
                const isSelected =
                  Boolean(selectedLocality) &&
                  selectedLocality.name === loc.name &&
                  selectedLocality.pinCode === loc.pinCode;

                return (
                  <button
                    key={`${loc.name}-${loc.pinCode}`}
                    onClick={() => {
                      onSelectLocality({
                        ...loc,
                        city: 'Saharanpur',
                        state: 'Uttar Pradesh',
                      });
                      onClose();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-medium text-slate-900 group-hover:text-orange-900">
                          {loc.name}
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-2">
                          <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                            PIN {loc.pinCode}
                          </span>
                          <span>•</span>
                          <span>{loc.areaType}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
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
          <span>Shipping charges &amp; ETA adjust automatically by PIN</span>
          <span className="font-semibold text-[#091e3a]">Pan-India Ready</span>
        </div>
      </div>
    </div>
  );
};

