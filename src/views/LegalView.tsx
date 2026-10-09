import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { LegalDocType } from '../types';

interface LegalViewProps {
  initialDoc?: LegalDocType;
}

export const LegalView: React.FC<LegalViewProps> = ({ initialDoc = 'about' }) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    if (initialDoc) setActiveDoc(initialDoc);
  }, [initialDoc]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Draft Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold uppercase tracking-wider block mb-0.5">
            Legal Draft Disclaimer — Legal Review Required Before Public Launch
          </strong>
          These policies, seller agreements, and disclaimers are working drafts prepared for the MattoKart platform MVP. Prior to commercial public launch and payment gateway activation in Saharanpur, Uttar Pradesh, all documents must undergo legal vetting under the Indian Information Technology Act 2000, Consumer Protection (E-Commerce) Rules 2020, and applicable local trade statutes.
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-2 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setActiveDoc('about')}
          className={`px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
            activeDoc === 'about'
              ? 'bg-orange-600 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          About MattoKart
        </button>

        <button
          onClick={() => setActiveDoc('contact')}
          className={`px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
            activeDoc === 'contact'
              ? 'bg-orange-600 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Contact Us
        </button>

        <button
          onClick={() => setActiveDoc('terms')}
          className={`px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
            activeDoc === 'terms'
              ? 'bg-orange-600 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Terms and Conditions
        </button>

        <button
          onClick={() => setActiveDoc('seller-agreement')}
          className={`px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
            activeDoc === 'seller-agreement'
              ? 'bg-orange-600 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Seller Agreement (FREE 1st Year)
        </button>

        <button
          onClick={() => setActiveDoc('privacy')}
          className={`px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
            activeDoc === 'privacy'
              ? 'bg-orange-600 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Privacy Policy
        </button>

        <button
          onClick={() => setActiveDoc('returns-refunds')}
          className={`px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
            activeDoc === 'returns-refunds'
              ? 'bg-orange-600 text-white font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Returns & Complaints
        </button>
      </div>

      {/* Main Content Paper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        {/* 1. About MattoKart */}
        {activeDoc === 'about' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Our Story & Vision
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
                About MattoKart
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Tagline: "Sab Kuch, Ek Hi Jagah!" • Proudly Founded in Saharanpur, UP
              </p>
            </div>

            <p>
              <strong>MattoKart</strong> was founded with a singular conviction: to empower the vibrant retail backbone, master woodcraft artisans, building materials depots, and independent shopkeepers of <strong>Saharanpur, Uttar Pradesh</strong> with a modern digital storefront.
            </p>

            <h3 className="text-base font-bold text-slate-900">Why Saharanpur?</h3>
            <p>
              Saharanpur has centuries of commercial heritage — celebrated worldwide for its GI-tagged Sheesham wood carving, its strategic trade intersection connecting Uttarakhand, Haryana, and western UP, and its bustling markets on Court Road, Delhi Road bypass, Bajoria Road, and Nehru Market.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">Direct Dukaan Connect</h4>
                <p className="text-xs text-slate-600">
                  No layers of remote middlemen or inflated markups. Buyers connect straight to the shop owner via WhatsApp or local phone call.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">FREE First-Year Seller Access</h4>
                <p className="text-xs text-slate-600">
                  Join MattoKart — FREE for Your First Year. No registration fee. No listing fee during the first year, keeping local business profitable.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">Permitted Quality Goods</h4>
                <p className="text-xs text-slate-600">
                  Strict adherence to genuine, permitted local goods: from construction materials (sariya, cement) to organic gur and fine woodcraft.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Contact Us */}
        {activeDoc === 'contact' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Local Saharanpur Helpdesk
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
                Contact MattoKart
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <Building className="w-5 h-5 text-orange-600" />
                  <span>Head Office / Operations Desk</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p><strong>MattoKart Technologies Pvt. Ltd. (Proposed)</strong></p>
                  <p>2nd Floor, Commercial Plaza, Court Road</p>
                  <p>Near District Collectorate (Kacheri)</p>
                  <p>Saharanpur, Uttar Pradesh – 247001, India</p>
                  <p className="text-slate-500 pt-1">Tagline: <em>Sab Kuch, Ek Hi Jagah!</em></p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <Phone className="w-5 h-5 text-orange-600" />
                  <span>Helpline & Official Support</span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p>Phone: <strong>+91 8221077674</strong></p>
                  <p>WhatsApp: <strong>+91 8221077674</strong></p>
                  <p>Official Email: <strong>creatormovie15@gmail.com</strong></p>
                  <p>Operating Hours: Monday – Saturday (9:00 AM – 7:30 PM IST)</p>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <a
                    href="tel:+918221077674"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call +91 8221077674</span>
                  </a>
                  <a
                    href="https://wa.me/918221077674"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Chat</span>
                  </a>
                  <a
                    href="mailto:creatormovie15@gmail.com"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-orange-600" />
                    <span>Send Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Terms and Conditions */}
        {activeDoc === 'terms' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Platform Rules
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
                Terms and Conditions (Draft)
              </h1>
            </div>

            <h3 className="font-bold text-slate-900 text-sm">1. Nature of Platform</h3>
            <p className="text-xs">
              MattoKart operates as an electronic marketplace intermediary connecting independent third-party sellers situated primarily in Saharanpur, Uttar Pradesh with buyers seeking local goods. MattoKart does not itself manufacture, stock, or hold title to products unless expressly specified.
            </p>

            <h3 className="font-bold text-slate-900 text-sm">2. Permitted Commercial Goods Only</h3>
            <p className="text-xs">
              Only legally permitted goods complying with Indian laws (including BIS standards, FSSAI regulations for packaged foods, and legal trade licenses) may be listed. Hazardous materials, illegal weapons, narcotic substances, stolen property, and counterfeit articles are strictly prohibited and subject to instant blacklisting.
            </p>

            <h3 className="font-bold text-slate-900 text-sm">3. Pricing and Inquiries</h3>
            <p className="text-xs">
              All prices displayed on MattoKart are quoted in Indian Rupees (₹). Sellers agree to provide honest quotes for transportation, loading, and unloading charges across Saharanpur municipal limits and neighboring tehsils.
            </p>
          </div>
        )}

        {/* 4. Seller Agreement */}
        {activeDoc === 'seller-agreement' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Seller Terms & Fee Structure
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
                Seller Agreement & FREE First-Year Policy
              </h1>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <h4 className="font-bold text-sm">Join MattoKart — FREE for Your First Year (₹0 Fee)</h4>
              <p className="font-semibold text-emerald-900">
                No registration fee. No listing fee during the first year.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Seller registration fee is ₹0, shop creation fee is ₹0, and product listing fee is ₹0. MattoKart does not charge sellers ₹199 or any other registration or listing fee. No registration payments are collected.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Important note on future fees: The free first-year policy does not automatically assume or promise that the service will become paid after one year. Any future fees or commercial terms must be clearly announced in advance and require your explicit acceptance before taking effect.
              </p>
            </div>

            <h3 className="font-bold text-slate-900 text-sm">Seller Commitments</h3>
            <ul className="text-xs space-y-1.5 list-disc pl-5">
              <li>Deliver genuine products as portrayed in listing photographs and descriptions.</li>
              <li>Provide valid tax invoice / bill of supply to buyers upon request.</li>
              <li>Maintain courteous communication with buyers via WhatsApp and phone.</li>
              <li>Inform MattoKart immediately of any supply shortages or catalog changes.</li>
            </ul>
          </div>
        )}

        {/* 5. Privacy Policy */}
        {activeDoc === 'privacy' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Data Protection
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
                Privacy Policy (Draft)
              </h1>
            </div>

            <p className="text-xs">
              MattoKart respects user privacy under the Digital Personal Data Protection Act 2023. We collect names, mobile numbers, and delivery localities solely to facilitate direct local enquiries between buyers and Saharanpur shopkeepers. We never sell buyer contact information to third-party telemarketers.
            </p>
          </div>
        )}

        {/* 6. Returns & Refunds */}
        {activeDoc === 'returns-refunds' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Buyer Resolution
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-brand">
                Returns, Refunds & Complaints Policy (Draft)
              </h1>
            </div>

            <p className="text-xs">
              Because MattoKart connects buyers directly with local brick-and-mortar stores in Saharanpur, physical inspection of goods prior to dispatch or upon delivery is strongly recommended. For bulk construction supplies (cement, TMT steel) and custom woodcraft, returns must be coordinated according to the seller's specific terms before unloading.
            </p>
            <p className="text-xs">
              In case of unaddressed disputes, buyers may file an escalation directly with the MattoKart Saharanpur Grievance Officer at <a href="mailto:creatormovie15@gmail.com" className="font-bold underline text-orange-600 hover:text-orange-700">creatormovie15@gmail.com</a> or call/WhatsApp <strong>+91 8221077674</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
