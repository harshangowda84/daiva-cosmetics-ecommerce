import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, RotateCcw, FileText, Phone, Mail, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { renderFormattedText } from '../utils/textFormatter';

interface PolicyPageProps {
  initialTab?: string;
  onNavigate: (page: string, param?: string) => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ initialTab = 'refund-policy', onNavigate }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { settings, customPolicies } = useSettings();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-800 dark:text-rose-400">
          Trust, Safety & Legal Policies
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 dark:text-[#EDE4DA]">
          Customer Care & Policies
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {settings.compliance_note}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="md:col-span-4 bg-white dark:bg-[#1A1410] rounded-3xl p-3 border border-neutral-200 dark:border-[#2C211A] shadow-xs space-y-1">
          <button
            onClick={() => setActiveTab('refund-policy')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'refund-policy'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#251D18]'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <div>
              <p>{settings.refund_policy_title}</p>
              <span className="text-[10px] font-normal text-neutral-400">7-Day return policy</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('shipping-policy')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'shipping-policy'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#251D18]'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p>{settings.shipping_policy_title}</p>
              <span className="text-[10px] font-normal text-neutral-400">{settings.shipping_policy_courier_partner}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('privacy-policy')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'privacy-policy'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#251D18]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p>{settings.privacy_policy_title}</p>
              <span className="text-[10px] font-normal text-neutral-400">PCI-DSS & Data safety</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#251D18]'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p>{settings.terms_policy_title}</p>
              <span className="text-[10px] font-normal text-neutral-400">Purchasing conditions</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('contact-us')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'contact-us'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#251D18]'
            }`}
          >
            <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <div>
              <p>{settings.grievance_policy_title}</p>
              <span className="text-[10px] font-normal text-neutral-400">Support & Officer info</span>
            </div>
          </button>

          {/* DYNAMIC CUSTOM COMPLIANCE & POLICIES */}
          {customPolicies
            .filter((p) => p.enabled)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.slug)}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
                  activeTab === p.slug
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#251D18]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                <div>
                  <p>{p.title}</p>
                  <span className="text-[10px] font-normal text-neutral-400">{p.subtitle || 'Statutory Compliance'}</span>
                </div>
              </button>
            ))}
        </div>

        {/* Policy Content */}
        <div className="md:col-span-8 bg-white dark:bg-[#1A1410] rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-[#2C211A] shadow-sm leading-relaxed text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 space-y-6">
          {/* 1. REFUND & CANCELLATION */}
          {activeTab === 'refund-policy' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 dark:border-[#2C211A] pb-3">
                <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-400 tracking-wider">{settings.site_name} Policy</span>
                <h2 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">{settings.refund_policy_title}</h2>
                <p className="text-xs text-neutral-400">Last updated: {settings.refund_policy_last_updated}</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">{settings.refund_policy_guarantee_badge}</strong>
                  {renderFormattedText(settings.refund_policy_guarantee_text)}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">1. Order Cancellation</h3>
                {renderFormattedText(settings.refund_policy_cancellation_terms)}

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">2. Hygiene & Safety Seal Policy</h3>
                {renderFormattedText(settings.refund_policy_hygiene_seal)}

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">3. Refund Processing Timeline</h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-300">
                  <li><strong>Razorpay Prepaid:</strong> {renderFormattedText(settings.refund_policy_timeline_prepaid)}</li>
                  <li><strong>Cash on Delivery (COD):</strong> {renderFormattedText(settings.refund_policy_timeline_cod)}</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. SHIPPING & DELIVERY */}
          {activeTab === 'shipping-policy' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 dark:border-[#2C211A] pb-3">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">Logistics & Transit</span>
                <h2 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">{settings.shipping_policy_title}</h2>
                <p className="text-xs text-neutral-400">Fulfilled by {settings.shipping_policy_courier_partner}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex gap-3">
                <Truck className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Courier Partner: {settings.shipping_policy_courier_partner}</strong>
                  {settings.shipping_policy_hub_location}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">1. Delivery Turnaround Time</h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-300">
                  <li><strong>Metro Cities:</strong> {settings.shipping_policy_metro_tat}</li>
                  <li><strong>Tier 2 & 3 Cities:</strong> {settings.shipping_policy_tier2_tat}</li>
                  <li><strong>Same-day Dispatch:</strong> {settings.shipping_policy_same_day_cutoff}</li>
                </ul>

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">2. Shipping Charges</h3>
                <p>
                  Enjoy <strong>FREE Shipping</strong> on all prepaid & COD orders valued above <strong>₹{settings.shipping_policy_free_threshold}</strong>. For orders below ₹{settings.shipping_policy_free_threshold}, a flat shipping fee of <strong>₹{settings.shipping_policy_standard_fee}</strong> is applied at checkout.
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">3. Live Tracking & Alerts</h3>
                {renderFormattedText(settings.shipping_policy_tracking_info)}
              </div>
            </div>
          )}

          {/* 3. PRIVACY POLICY */}
          {activeTab === 'privacy-policy' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 dark:border-[#2C211A] pb-3">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Security & Encryption</span>
                <h2 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">{settings.privacy_policy_title}</h2>
                <p className="text-xs text-neutral-400">{settings.privacy_policy_compliance_act}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">1. Information We Collect</h3>
                {renderFormattedText(settings.privacy_policy_data_collected)}

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">2. Payment Card & UPI Security</h3>
                {renderFormattedText(settings.privacy_policy_payment_security)}

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">3. Non-Disclosure & Cookie Policy</h3>
                {renderFormattedText(settings.privacy_policy_non_disclosure)}
              </div>
            </div>
          )}

          {/* 4. TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 dark:border-[#2C211A] pb-3">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">Legal Terms</span>
                <h2 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">{settings.terms_policy_title}</h2>
                <p className="text-xs text-neutral-400">{settings.terms_policy_subtitle}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">1. Cosmetic Suitability & Patch Tests</h3>
                {renderFormattedText(settings.terms_policy_patch_test)}

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">2. Pricing & Currency</h3>
                {renderFormattedText(settings.terms_policy_pricing_currency)}

                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">3. Governing Jurisdiction</h3>
                {renderFormattedText(settings.terms_policy_jurisdiction)}
              </div>
            </div>
          )}

          {/* 5. CONTACT US & GRIEVANCE REDRESSAL */}
          {activeTab === 'contact-us' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-neutral-100 dark:border-[#2C211A] pb-3">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 tracking-wider">Customer Support</span>
                <h2 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">{settings.grievance_policy_title}</h2>
                <p className="text-xs text-neutral-400">Consumer Protection (E-Commerce) Rules 2020 Statutory Disclosure</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#231A14] border border-neutral-200 dark:border-[#2C211A] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                    <MapPin className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                    <span>Registered Central Warehouse</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 text-xs">
                    {settings.warehouse_address}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#231A14] border border-neutral-200 dark:border-[#2C211A] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                    <Phone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Customer Concierge Hotline</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 text-xs">
                    <strong>Phone:</strong> {settings.contact_phone}<br />
                    <strong>Email:</strong> {settings.contact_email}<br />
                    <strong>Hours:</strong> {settings.contact_hours}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/60 text-purple-950 dark:text-purple-200 space-y-2">
                <strong className="block font-semibold">Designated Grievance Redressal Officer:</strong>
                <p className="text-xs">
                  In accordance with the Information Technology Act 2000 and Consumer Protection Rules:
                </p>
                <div className="text-xs space-y-1 font-mono text-purple-900 dark:text-purple-300 bg-white/70 dark:bg-[#1E1611] p-3 rounded-xl border border-purple-200 dark:border-purple-800/60">
                  <p>Officer Name: <strong>{settings.grievance_policy_officer_name}</strong></p>
                  <p>Designation: <strong>{settings.grievance_policy_officer_designation}</strong></p>
                  <p>Email: <strong>{settings.grievance_policy_officer_email}</strong></p>
                  {settings.grievance_policy_officer_phone && (
                    <p>Phone: <strong>{settings.grievance_policy_officer_phone}</strong></p>
                  )}
                  <p>Turnaround SLA: <strong>{settings.grievance_policy_turnaround_sla}</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* 6. DYNAMIC CUSTOM POLICIES */}
          {(() => {
            const customMatch = customPolicies.find((p) => p.slug === activeTab || p.id === activeTab);
            if (!customMatch) return null;
            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-neutral-100 dark:border-[#2C211A] pb-3">
                  <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-400 tracking-wider">
                    {customMatch.badge || `${settings.site_name} Compliance`}
                  </span>
                  <h2 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">
                    {customMatch.title}
                  </h2>
                  {customMatch.lastUpdated && (
                    <p className="text-xs text-neutral-400">Last updated: {customMatch.lastUpdated}</p>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-4">
                  {renderFormattedText(customMatch.content)}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
