import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, RotateCcw, FileText, Phone, Mail, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface PolicyPageProps {
  initialTab?: string;
  onNavigate: (page: string, param?: string) => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ initialTab = 'refund-policy', onNavigate }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-800">
          Trust, Safety & Legal Policies
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900">
          Customer Care & Policies
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500">
          Compliant with the Consumer Protection (E-Commerce) Rules 2020 and Indian IT Act.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="md:col-span-4 bg-white rounded-3xl p-3 border border-neutral-200 shadow-xs space-y-1">
          <button
            onClick={() => setActiveTab('refund-policy')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === 'refund-policy'
                ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-700" />
            <div>
              <p>Refund & Cancellation</p>
              <span className="text-[10px] font-normal text-neutral-400">7-Day return policy</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('shipping-policy')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === 'shipping-policy'
                ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-600" />
            <div>
              <p>Shipping & Delivery</p>
              <span className="text-[10px] font-normal text-neutral-400">Xpressbees 2-5 days</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('privacy-policy')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === 'privacy-policy'
                ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <p>Privacy Policy</p>
              <span className="text-[10px] font-normal text-neutral-400">PCI-DSS & Data safety</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === 'terms'
                ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <p>Terms of Service</p>
              <span className="text-[10px] font-normal text-neutral-400">Purchasing conditions</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('contact-us')}
            className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition ${
              activeTab === 'contact-us'
                ? 'bg-rose-50 text-rose-900 border border-rose-200/80 shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Phone className="w-4 h-4 text-purple-600" />
            <div>
              <p>Contact Us & Grievance</p>
              <span className="text-[10px] font-normal text-neutral-400">Support & Officer info</span>
            </div>
          </button>
        </div>

        {/* Policy Content */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm leading-relaxed text-xs sm:text-sm text-neutral-700 space-y-6">
          {/* 1. REFUND & CANCELLATION */}
          {activeTab === 'refund-policy' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Aura Luxe Policy</span>
                <h2 className="font-serif text-2xl text-neutral-900 mt-1">Refund & Cancellation Policy</h2>
                <p className="text-xs text-neutral-400">Last updated: November 2026</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-xs flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">7-Day Hassle-Free Return Guarantee</strong>
                  If your cosmetic product arrives damaged, leaked, or incorrect, you are eligible for an immediate replacement or full refund within 7 days of delivery.
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900">1. Order Cancellation</h3>
                <p>
                  You can cancel your order any time prior to warehouse dispatch by visiting your <strong>My Orders</strong> tab or emailing support@auraluxe.com. Once dispatched with our courier partner (Xpressbees), shipments cannot be recalled in transit; you may refuse delivery at your doorstep or initiate a return upon receipt.
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900">2. Hygiene & Safety Seal Policy</h3>
                <p>
                  Due to FDA and cosmetic health & safety regulations, opened cosmetic items, lip tints, and facial creams cannot be returned once their tamper-evident protective seal is broken, unless the formula is defective or damaged during transit.
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900">3. Refund Processing Timeline</h3>
                <p>
                  Approved refunds are processed back directly to the original payment source:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                  <li><strong>Razorpay Prepaid (UPI, Cards, NetBanking):</strong> Credited to your bank account within 5–7 business days.</li>
                  <li><strong>Cash on Delivery (COD):</strong> Refunded via IMPS / UPI transfer upon receipt of customer banking details within 3–5 business days.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. SHIPPING & DELIVERY */}
          {activeTab === 'shipping-policy' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Logistics & Transit</span>
                <h2 className="font-serif text-2xl text-neutral-900 mt-1">Shipping & Delivery Policy</h2>
                <p className="text-xs text-neutral-400">Fulfilled by Xpressbees Logistics</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs flex gap-3">
                <Truck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Courier Partner: Xpressbees Express</strong>
                  All Aura Luxe cosmetics orders are fulfilled from our temperature-controlled central hub in Bengaluru via Xpressbees Air & Surface Express.
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900">1. Delivery Turnaround Time</h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                  <li><strong>Metro Cities (Bengaluru, Mumbai, Delhi-NCR, Chennai, Hyderabad, Kolkata):</strong> 2–3 business days.</li>
                  <li><strong>Tier 2 & 3 Cities across India:</strong> 3–5 business days.</li>
                  <li><strong>Order Processing Time:</strong> Orders placed before 2:00 PM IST are manifested and dispatched the same day (excluding Sundays & national holidays).</li>
                </ul>

                <h3 className="font-serif text-base font-semibold text-neutral-900">2. Shipping Charges</h3>
                <p>
                  Enjoy <strong>FREE Shipping</strong> on all prepaid & COD orders valued above <strong>₹999</strong>. For orders below ₹999, a flat shipping fee of <strong>₹99</strong> is applied at checkout.
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900">3. Live Tracking & SMS Alerts</h3>
                <p>
                  As soon as your shipment is dispatched, you receive a unique <strong>Air Waybill (AWB)</strong> number and live tracking link via email and SMS. You can also view step-by-step milestones under your <strong>Profile &gt; Order History</strong> page.
                </p>
              </div>
            </div>
          )}

          {/* 3. PRIVACY POLICY */}
          {activeTab === 'privacy-policy' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Security & Encryption</span>
                <h2 className="font-serif text-2xl text-neutral-900 mt-1">Privacy & Data Protection Policy</h2>
                <p className="text-xs text-neutral-400">Compliant with Section 43A of Information Technology Act 2000</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900">1. Information We Collect</h3>
                <p>
                  When you browse, register, or place an order on Aura Luxe, we collect your name, email, phone number, shipping address, and order transaction records strictly for order fulfillment, logistics delivery, and customer service.
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900">2. Payment Card & UPI Security</h3>
                <p>
                  Aura Luxe does not store or process your credit/debit card numbers or UPI PINs. All payment transactions are encrypted via 256-bit SSL and processed directly by <strong>Razorpay Software Private Limited</strong>, a PCI-DSS Level 1 certified payment gateway regulated by the Reserve Bank of India (RBI).
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900">3. Non-Disclosure & Cookie Policy</h3>
                <p>
                  We never sell, rent, or trade your personal details to third-party marketing brokers. Address and contact details are shared strictly with our contracted courier partner (Xpressbees) solely to facilitate delivery.
                </p>
              </div>
            </div>
          )}

          {/* 4. TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Legal Terms</span>
                <h2 className="font-serif text-2xl text-neutral-900 mt-1">Terms of Service</h2>
                <p className="text-xs text-neutral-400">Binding e-commerce terms of use</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-neutral-900">1. Cosmetic Suitability & Patch Tests</h3>
                <p>
                  While our formulations utilize dermatologically validated botanical extracts, individual skin chemistry varies. We recommend performing a 24-hour patch test on the inner wrist or behind the ear before full facial application.
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900">2. Pricing & Currency</h3>
                <p>
                  All catalog prices are listed in Indian Rupees (INR) and are inclusive of Goods & Services Tax (GST). Aura Luxe reserves the right to modify prices, bundle discounts, and inventory availability without prior notice.
                </p>

                <h3 className="font-serif text-base font-semibold text-neutral-900">3. Governing Jurisdiction</h3>
                <p>
                  Any dispute arising from transactions on this platform shall be governed by the laws of India and subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
                </p>
              </div>
            </div>
          )}

          {/* 5. CONTACT US & GRIEVANCE REDRESSAL */}
          {activeTab === 'contact-us' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Customer Support</span>
                <h2 className="font-serif text-2xl text-neutral-900 mt-1">Contact Us & Grievance Redressal</h2>
                <p className="text-xs text-neutral-400">Consumer Protection (E-Commerce) Rules 2020 Statutory Disclosure</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900">
                    <MapPin className="w-4 h-4 text-rose-700" />
                    <span>Registered Central Warehouse</span>
                  </div>
                  <p className="text-neutral-600 text-xs">
                    <strong>Aura Luxe Cosmetics Hub</strong><br />
                    124, 4th Cross, Indiranagar<br />
                    Bengaluru, Karnataka - 560038, India
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900">
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>Customer Concierge Hotline</span>
                  </div>
                  <p className="text-neutral-600 text-xs">
                    <strong>Phone:</strong> +91 98765 43210<br />
                    <strong>Email:</strong> support@auraluxe.com<br />
                    <strong>Hours:</strong> Mon - Sat, 9:30 AM – 6:30 PM IST
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200/70 text-purple-950 space-y-2">
                <strong className="block font-semibold">Designated Grievance Redressal Officer:</strong>
                <p className="text-xs">
                  In accordance with the Information Technology Act 2000 and Consumer Protection Rules:
                </p>
                <div className="text-xs space-y-1 font-mono text-purple-900 bg-white/60 p-3 rounded-xl border border-purple-200">
                  <p>Officer Name: <strong>Priya S. Narang</strong></p>
                  <p>Designation: <strong>Nodal Officer - Grievance & Compliance</strong></p>
                  <p>Email: <strong>grievance@auraluxe.com</strong></p>
                  <p>Turnaround SLA: <strong>Acknowledgment within 48 hours; resolution within 30 days</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
