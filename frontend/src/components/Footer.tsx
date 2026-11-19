import React from 'react';
import { Sparkles, Truck, ShieldCheck, HeartHandshake, Phone, Mail, Instagram, Facebook, Youtube, MessageCircle, Twitter, Linkedin, Share2, Globe } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, customPolicies, socialLinks } = useSettings();

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />;
      case 'pinterest':
        return <Share2 className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <footer className="bg-[#18110D] text-[#ede6de] pt-14 pb-8 border-t border-[#2e231c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Props Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-[#2e231c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">{settings.value_prop_1_title}</p>
              <p className="text-[11px] text-neutral-400">{settings.value_prop_1_subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">{settings.value_prop_2_title}</p>
              <p className="text-[11px] text-neutral-400">{settings.value_prop_2_subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">{settings.value_prop_3_title}</p>
              <p className="text-[11px] text-neutral-400">{settings.value_prop_3_subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2a1e16] flex items-center justify-center text-rose-300 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wider uppercase">{settings.value_prop_4_title}</p>
              <p className="text-[11px] text-neutral-400">{settings.value_prop_4_subtitle}</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          <div className="space-y-3">
            <div className="font-serif text-xl tracking-[0.2em] font-medium text-white">
              {settings.site_name || 'AURA LUXE'}
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {settings.brand_tagline}
            </p>

            {/* Dynamic Social handles */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap">
              {socialLinks && socialLinks.length > 0 ? (
                socialLinks
                  .filter((s) => s.active)
                  .map((social) => (
                    <a
                      key={social.id}
                      href={social.url.startsWith('http') || social.url.startsWith('https://wa.me') ? social.url : `https://${social.url}`}
                      target="_blank"
                      rel="noreferrer"
                      title={social.label}
                      className="w-8 h-8 rounded-full bg-[#281c15] hover:bg-rose-900/60 flex items-center justify-center text-neutral-300 hover:text-white transition shadow-sm hover:scale-110"
                    >
                      {getSocialIcon(social.platform)}
                    </a>
                  ))
              ) : (
                <>
                  {settings.instagram_url && (
                    <a
                      href={settings.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Instagram"
                      className="w-8 h-8 rounded-full bg-[#281c15] hover:bg-rose-900/60 flex items-center justify-center text-neutral-300 hover:text-white transition"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {settings.facebook_url && (
                    <a
                      href={settings.facebook_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Facebook"
                      className="w-8 h-8 rounded-full bg-[#281c15] hover:bg-blue-900/60 flex items-center justify-center text-neutral-300 hover:text-white transition"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {settings.youtube_url && (
                    <a
                      href={settings.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      title="YouTube"
                      className="w-8 h-8 rounded-full bg-[#281c15] hover:bg-red-900/60 flex items-center justify-center text-neutral-300 hover:text-white transition"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                  {settings.whatsapp_number && (
                    <a
                      href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp"
                      className="w-8 h-8 rounded-full bg-[#281c15] hover:bg-emerald-900/60 flex items-center justify-center text-neutral-300 hover:text-white transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200 mb-3">
              Cosmetics Range
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('plp', 'Serums & Treatments')} className="hover:text-rose-300 cursor-pointer">Serums & Treatments</button></li>
              <li><button onClick={() => onNavigate('plp', 'Moisturizers')} className="hover:text-rose-300 cursor-pointer">Barrier Moisturisers</button></li>
              <li><button onClick={() => onNavigate('plp', 'Lip Care & Makeup')} className="hover:text-rose-300 cursor-pointer">Lip Care & Lipsticks</button></li>
              <li><button onClick={() => onNavigate('plp', 'Sun Care')} className="hover:text-rose-300 cursor-pointer">Broad Spectrum SPF</button></li>
              <li><button onClick={() => onNavigate('plp', 'Face Makeup')} className="hover:text-rose-300 cursor-pointer">Satin Foundations</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200 mb-3">
              Customer Concierge
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('wishlist')} className="hover:text-rose-300 cursor-pointer">My Saved Wishlist</button></li>
              <li><button onClick={() => onNavigate('cart')} className="hover:text-rose-300 cursor-pointer">Shopping Bag</button></li>
              <li><button onClick={() => onNavigate('checkout')} className="hover:text-rose-300 cursor-pointer">Express Checkout</button></li>
              <li><button onClick={() => onNavigate('profile')} className="hover:text-rose-300 cursor-pointer">My Account & Orders</button></li>
              <li><button onClick={() => onNavigate('plp', 'All')} className="hover:text-rose-300 cursor-pointer">Full Catalog</button></li>
              <li><button onClick={() => onNavigate('policy', 'contact-us')} className="hover:text-rose-300 text-rose-300 cursor-pointer">Help & Contact Us</button></li>
            </ul>
            <div className="mt-3 pt-3 border-t border-[#2e231c] text-[11px] text-neutral-400 space-y-1">
              <p className="flex items-center gap-1.5 text-neutral-300">
                <Phone className="w-3.5 h-3.5 text-rose-400" />
                <span>{settings.contact_phone}</span>
              </p>
              <p className="flex items-center gap-1.5 text-neutral-300">
                <Mail className="w-3.5 h-3.5 text-rose-400" />
                <span>{settings.contact_email}</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-200 mb-3">
              Policies & Compliance
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigate('policy', 'refund-policy')} className="hover:text-rose-300 cursor-pointer">{settings.refund_policy_title} (7 Days)</button></li>
              <li><button onClick={() => onNavigate('policy', 'shipping-policy')} className="hover:text-rose-300 cursor-pointer">{settings.shipping_policy_title} ({settings.shipping_policy_courier_partner?.split(' ')[0] || 'Express'})</button></li>
              <li><button onClick={() => onNavigate('policy', 'privacy-policy')} className="hover:text-rose-300 cursor-pointer">{settings.privacy_policy_title}</button></li>
              <li><button onClick={() => onNavigate('policy', 'terms')} className="hover:text-rose-300 cursor-pointer">{settings.terms_policy_title}</button></li>
              <li><button onClick={() => onNavigate('policy', 'contact-us')} className="hover:text-rose-300 cursor-pointer">Grievance Redressal Officer</button></li>
              {customPolicies
                .filter((p) => p.enabled)
                .map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => onNavigate('policy', p.slug)}
                      className="hover:text-rose-300 cursor-pointer"
                    >
                      {p.title}
                    </button>
                  </li>
                ))}
            </ul>
            <div className="mt-3 p-2.5 bg-[#241a13] rounded-xl border border-[#3b2d22] text-[10px] text-neutral-400">
              {settings.compliance_note}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#2e231c] flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 gap-3">
          <p>{settings.copyright_text}</p>
          <div className="flex gap-4 text-[11px] flex-wrap justify-center">
            <button onClick={() => onNavigate('policy', 'refund-policy')} className="hover:text-neutral-300 cursor-pointer">Refunds</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'shipping-policy')} className="hover:text-neutral-300 cursor-pointer">Shipping</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'privacy-policy')} className="hover:text-neutral-300 cursor-pointer">Privacy</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'terms')} className="hover:text-neutral-300 cursor-pointer">Terms</button>
            <span>•</span>
            <button onClick={() => onNavigate('policy', 'contact-us')} className="hover:text-neutral-300 cursor-pointer">Grievance</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
