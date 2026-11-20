import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'mobile-drawer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || (!canInstall && !isIOS)) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'mobile-drawer' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-[#091e3a] font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Install MattoKart App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-[#091e3a] font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap"
          aria-label="Install MattoKart App"
        >
          <Download className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>Install App</span>
        </button>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="ios-install-title" className="font-bold text-base font-brand text-[#091e3a]">
                Install MattoKart on iPhone / iPad
              </h2>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close install instructions"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add MattoKart to your Home Screen for fast access &amp; offline browsing:
            </p>
            <ol className="space-y-2 text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <li className="flex items-center gap-2">
                <Share className="w-4 h-4 text-[#091e3a] shrink-0" aria-hidden="true" />
                <span>
                  1. Tap the <strong>Share</strong> icon in Safari toolbar
                </span>
              </li>
              <li className="flex items-center gap-2">
                <PlusSquare className="w-4 h-4 text-[#c2410c] shrink-0" aria-hidden="true" />
                <span>
                  2. Tap <strong>Add to Home Screen</strong>
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-[#091e3a] text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
