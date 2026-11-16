import React from 'react';
import { Sparkles, Truck, ShieldCheck, HeartHandshake } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#18110D] text-[#ede6de] pt-14 pb-8 border-t border-[#2e231c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Props Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-[#2e231c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">100% Organic</p>
              <p className="text-[11px] text-neutral-400">Certified Botanical Actives</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">Dermatologist Tested</p>
              <p className="text-[11px] text-neutral-400">Gentle & Safe for All Skin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">Express Delivery</p>
              <p className="text-[11px] text-neutral-400">Fast 2-3 Day Pan-India</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">Cruelty Free</p>
              <p className="text-[11px] text-neutral-400">100% PETA Certified</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          <div className="space-y-3">
            <div className="font-serif text-xl tracking-[0.2em] font-medium text-white">
              AURA LUXE
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Curated luxury cosmetics, clean clinical skincare, and nourishing botanicals crafted to bring out your skin's natural luminescence.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200 mb-3">
              Cosmetics Range
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('plp', 'Serums & Treatments')} className="hover:text-rose-300">Serums & Treatments</button></li>
              <li><button onClick={() => onNavigate('plp', 'Moisturizers')} className="hover:text-rose-300">Barrier Moisturisers</button></li>
              <li><button onClick={() => onNavigate('plp', 'Lip Care & Makeup')} className="hover:text-rose-300">Lip Care & Lipsticks</button></li>
              <li><button onClick={() => onNavigate('plp', 'Sun Care')} className="hover:text-rose-300">Broad Spectrum SPF</button></li>
              <li><button onClick={() => onNavigate('plp', 'Face Makeup')} className="hover:text-rose-300">Satin Foundations</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200 mb-3">
              Customer Concierge
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('wishlist')} className="hover:text-rose-300">My Saved Wishlist</button></li>
              <li><button onClick={() => onNavigate('cart')} className="hover:text-rose-300">Shopping Bag</button></li>
              <li><button onClick={() => onNavigate('checkout')} className="hover:text-rose-300">Express Checkout</button></li>
              <li><button onClick={() => onNavigate('profile')} className="hover:text-rose-300">My Account & Orders</button></li>
              <li><button onClick={() => onNavigate('plp', 'All')} className="hover:text-rose-300">Full Catalog</button></li>
              <li><button onClick={() => onNavigate('policy', 'contact-us')} className="hover:text-rose-300 text-rose-300">Help & Contact Us</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200 mb-3">
              Policies & Compliance
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('policy', 'refund-policy')} className="hover:text-rose-300">Refund & Cancellation (7 Days)</button></li>
              <li><button onClick={() => onNavigate('policy', 'shipping-policy')} className="hover:text-rose-300">Shipping Policy (Xpressbees)</button></li>
              <li><button onClick={() => onNavigate('policy', 'privacy-policy')} className="hover:text-rose-300">Privacy & Data Security</button></li>
              <li><button onClick={() => onNavigate('policy', 'terms')} className="hover:text-rose-300">Terms of Service</button></li>
              <li><button onClick={() => onNavigate('policy', 'contact-us')} className="hover:text-rose-300">Grievance Redressal Officer</button></li>
            </ul>
            <div className="mt-3 p-2.5 bg-[#241a13] rounded-xl border border-[#3b2d22] text-[10px] text-neutral-400">
              Compliant with Consumer Protection (E-Commerce) Rules 2020.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#2e231c] flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 gap-3">
          <p>© 2026 AURA LUXE Cosmetics. All Rights Reserved.</p>
          <div className="flex gap-4 text-[11px] flex-wrap justify-center">
            <button onClick={() => onNavigate('policy', 'refund-policy')} className="hover:text-neutral-300">Refunds</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'shipping-policy')} className="hover:text-neutral-300">Shipping</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'privacy-policy')} className="hover:text-neutral-300">Privacy</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'terms')} className="hover:text-neutral-300">Terms</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'contact-us')} className="hover:text-neutral-300">Grievance</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
