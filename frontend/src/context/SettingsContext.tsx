import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface CustomPolicy {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  badge?: string;
  content: string;
  lastUpdated?: string;
  enabled: boolean;
}

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'pinterest' | 'linkedin' | 'whatsapp' | 'tiktok' | 'threads' | 'custom';
  label: string;
  url: string;
  active: boolean;
}

export interface SiteSettings {
  // Brand & Footer
  site_name: string;
  brand_tagline: string;
  contact_phone: string;
  contact_email: string;
  contact_hours: string;
  warehouse_address: string;
  compliance_note: string;
  copyright_text: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  whatsapp_number: string;
  value_prop_1_title: string;
  value_prop_1_subtitle: string;
  value_prop_2_title: string;
  value_prop_2_subtitle: string;
  value_prop_3_title: string;
  value_prop_3_subtitle: string;
  value_prop_4_title: string;
  value_prop_4_subtitle: string;

  // Refund & Cancellation Policy
  refund_policy_title: string;
  refund_policy_last_updated: string;
  refund_policy_guarantee_badge: string;
  refund_policy_guarantee_text: string;
  refund_policy_cancellation_terms: string;
  refund_policy_hygiene_seal: string;
  refund_policy_timeline_prepaid: string;
  refund_policy_timeline_cod: string;

  // Shipping & Delivery Policy
  shipping_policy_title: string;
  shipping_policy_courier_partner: string;
  shipping_policy_hub_location: string;
  shipping_policy_metro_tat: string;
  shipping_policy_tier2_tat: string;
  shipping_policy_same_day_cutoff: string;
  shipping_policy_free_threshold: string;
  shipping_policy_standard_fee: string;
  shipping_policy_tracking_info: string;

  // Privacy Policy
  privacy_policy_title: string;
  privacy_policy_compliance_act: string;
  privacy_policy_data_collected: string;
  privacy_policy_payment_security: string;
  privacy_policy_non_disclosure: string;

  // Terms of Service
  terms_policy_title: string;
  terms_policy_subtitle: string;
  terms_policy_patch_test: string;
  terms_policy_pricing_currency: string;
  terms_policy_jurisdiction: string;

  // Grievance Redressal
  grievance_policy_title: string;
  grievance_policy_officer_name: string;
  grievance_policy_officer_designation: string;
  grievance_policy_officer_email: string;
  grievance_policy_officer_phone: string;
  grievance_policy_turnaround_sla: string;
  grievance_policy_warehouse_address: string;

  // Custom Policies & Compliance Documents JSON
  custom_policies_json: string;

  // Social Links JSON
  social_links_json: string;

  [key: string]: string;
}

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { id: 'social-ig', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/auraluxe.official', active: true },
  { id: 'social-tw', platform: 'twitter', label: 'Twitter / X', url: 'https://x.com/auraluxe', active: true },
  { id: 'social-fb', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/auraluxe', active: true },
  { id: 'social-yt', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@auraluxe', active: true },
  { id: 'social-wa', platform: 'whatsapp', label: 'WhatsApp Concierge', url: 'https://wa.me/919876543210', active: true },
];

const DEFAULT_CUSTOM_POLICIES: CustomPolicy[] = [
  {
    id: 'policy-sustainability',
    slug: 'sustainability-standards',
    title: 'Sustainability & Ethical Sourcing',
    subtitle: '100% Recyclable Glass & Ethical Botanicals',
    badge: 'Eco & Ethical Standards',
    content: `At Aura Luxe, our commitment to clean luxury extends from formula chemistry to ethical environmental stewardship.

1. 100% Post-Consumer Recycled Packaging
All serum and cream jars are crafted from heavy flint apothecary glass that is infinitely recyclable. Outer product boxes are printed with non-toxic soy-based inks on FSC-certified sustainable Swedish paperboard.

2. Ethical Mineral Mica & Sourcing Audits
We enforce a strict zero-tolerance policy against child labor. All mineral pigments, pearlescent micas, and gold pigments are sourced exclusively from audited, certified mines in Andhra Pradesh and Rajasthan under ethical fair-wage labor standards.

3. Zero Waste Cold-Process Formulations
Our Bengaluru formulation labs operate on 100% rooftop solar energy and utilize water-saving cold-process botanical extraction to preserve active plant enzymes without high thermal carbon footprints.`,
    lastUpdated: 'November 2026',
    enabled: true,
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  // Brand & Footer
  site_name: 'AURA LUXE',
  brand_tagline: "Curated luxury cosmetics, clean clinical skincare, and nourishing botanicals crafted to bring out your skin's natural luminescence.",
  contact_phone: '+91 98765 43210',
  contact_email: 'support@auraluxe.com',
  contact_hours: 'Mon - Sat, 9:30 AM – 6:30 PM IST',
  warehouse_address: '124, 4th Cross, Indiranagar, Bengaluru, Karnataka - 560038, India',
  compliance_note: 'Compliant with Consumer Protection (E-Commerce) Rules 2020 and Indian IT Act.',
  copyright_text: '© 2026 AURA LUXE Cosmetics. All Rights Reserved.',
  instagram_url: 'https://instagram.com/auraluxecosmetics',
  facebook_url: 'https://facebook.com/auraluxecosmetics',
  youtube_url: 'https://youtube.com/@auraluxecosmetics',
  whatsapp_number: '+91 98765 43210',
  value_prop_1_title: '100% Organic',
  value_prop_1_subtitle: 'Certified Botanical Actives',
  value_prop_2_title: 'Dermatologist Tested',
  value_prop_2_subtitle: 'Gentle & Safe for All Skin',
  value_prop_3_title: 'Express Delivery',
  value_prop_3_subtitle: 'Fast 2-3 Day Pan-India',
  value_prop_4_title: 'Cruelty Free',
  value_prop_4_subtitle: '100% PETA Certified',

  // Refund & Cancellation Policy
  refund_policy_title: 'Refund & Cancellation Policy',
  refund_policy_last_updated: 'November 2026',
  refund_policy_guarantee_badge: '7-Day Hassle-Free Return Guarantee',
  refund_policy_guarantee_text: 'If your cosmetic product arrives damaged, leaked, or incorrect, you are eligible for an immediate replacement or full refund within 7 days of delivery.',
  refund_policy_cancellation_terms: 'You can cancel your order any time prior to warehouse dispatch by visiting your My Orders tab or emailing support@auraluxe.com. Once dispatched with our courier partner (Xpressbees), shipments cannot be recalled in transit; you may refuse delivery at your doorstep or initiate a return upon receipt.',
  refund_policy_hygiene_seal: 'Due to FDA and cosmetic health & safety regulations, opened cosmetic items, lip tints, and facial creams cannot be returned once their tamper-evident protective seal is broken, unless the formula is defective or damaged during transit.',
  refund_policy_timeline_prepaid: 'Razorpay Prepaid (UPI, Cards, NetBanking): Credited to your bank account within 5–7 business days.',
  refund_policy_timeline_cod: 'Cash on Delivery (COD): Refunded via IMPS / UPI transfer upon receipt of customer banking details within 3–5 business days.',

  // Shipping & Delivery Policy
  shipping_policy_title: 'Shipping & Delivery Policy',
  shipping_policy_courier_partner: 'Xpressbees Logistics',
  shipping_policy_hub_location: 'Fulfilled from our temperature-controlled central hub in Bengaluru via Xpressbees Air & Surface Express.',
  shipping_policy_metro_tat: 'Metro Cities (Bengaluru, Mumbai, Delhi-NCR, Chennai, Hyderabad, Kolkata): 2–3 business days.',
  shipping_policy_tier2_tat: 'Tier 2 & 3 Cities across India: 3–5 business days.',
  shipping_policy_same_day_cutoff: 'Orders placed before 2:00 PM IST are manifested and dispatched the same day (excluding Sundays & national holidays).',
  shipping_policy_free_threshold: '999',
  shipping_policy_standard_fee: '99',
  shipping_policy_tracking_info: 'As soon as your shipment is dispatched, you receive a unique Air Waybill (AWB) number and live tracking link via email and SMS. You can also view step-by-step milestones under your Profile > Order History page.',

  // Privacy Policy
  privacy_policy_title: 'Privacy & Data Protection Policy',
  privacy_policy_compliance_act: 'Compliant with Section 43A of Information Technology Act 2000',
  privacy_policy_data_collected: 'When you browse, register, or place an order on Aura Luxe, we collect your name, email, phone number, shipping address, and order transaction records strictly for order fulfillment, logistics delivery, and customer service.',
  privacy_policy_payment_security: 'Aura Luxe does not store or process your credit/debit card numbers or UPI PINs. All payment transactions are encrypted via 256-bit SSL and processed directly by Razorpay Software Private Limited, a PCI-DSS Level 1 certified payment gateway regulated by the Reserve Bank of India (RBI).',
  privacy_policy_non_disclosure: 'We never sell, rent, or trade your personal details to third-party marketing brokers. Address and contact details are shared strictly with our contracted courier partner (Xpressbees) solely to facilitate delivery.',

  // Terms of Service
  terms_policy_title: 'Terms of Service',
  terms_policy_subtitle: 'Binding e-commerce terms of use',
  terms_policy_patch_test: 'While our formulations utilize dermatologically validated botanical extracts, individual skin chemistry varies. We recommend performing a 24-hour patch test on the inner wrist or behind the ear before full facial application.',
  terms_policy_pricing_currency: 'All catalog prices are listed in Indian Rupees (INR) and are inclusive of Goods & Services Tax (GST). Aura Luxe reserves the right to modify prices, bundle discounts, and inventory availability without prior notice.',
  terms_policy_jurisdiction: 'Any dispute arising from transactions on this platform shall be governed by the laws of India and subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.',

  // Grievance Redressal
  grievance_policy_title: 'Contact Us & Grievance Redressal',
  grievance_policy_officer_name: 'Priya S. Narang',
  grievance_policy_officer_designation: 'Nodal Officer - Grievance & Compliance',
  grievance_policy_officer_email: 'grievance@auraluxe.com',
  grievance_policy_officer_phone: '+91 98765 43210',
  grievance_policy_turnaround_sla: 'Acknowledgment within 48 hours; resolution within 30 days',
  grievance_policy_warehouse_address: '124, 4th Cross, Indiranagar, Bengaluru, Karnataka - 560038, India',

  // Custom Policies JSON
  custom_policies_json: JSON.stringify(DEFAULT_CUSTOM_POLICIES),

  // Social Links JSON
  social_links_json: JSON.stringify(DEFAULT_SOCIAL_LINKS),
};

const STORAGE_KEY = 'aura_luxe_site_settings';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface SettingsContextType {
  settings: SiteSettings;
  customPolicies: CustomPolicy[];
  socialLinks: SocialLink[];
  updateSetting: (key: keyof SiteSettings | string, value: string) => void;
  updateMultipleSettings: (patch: Partial<SiteSettings>) => void;
  saveSettingsToBackend: (overrideSettings?: SiteSettings) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  addCustomPolicy: (policy: Omit<CustomPolicy, 'id'>) => Promise<boolean>;
  updateCustomPolicy: (id: string, updated: Partial<CustomPolicy>) => Promise<boolean>;
  deleteCustomPolicy: (id: string) => Promise<boolean>;
  addSocialLink: (link: Omit<SocialLink, 'id'>) => Promise<boolean>;
  updateSocialLink: (id: string, updated: Partial<SocialLink>) => Promise<boolean>;
  deleteSocialLink: (id: string) => Promise<boolean>;
  isLoading: boolean;
  isSaving: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Failed to parse cached site settings', e);
    }
    return DEFAULT_SITE_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Derived custom policies list from JSON
  const customPolicies = useMemo<CustomPolicy[]>(() => {
    try {
      if (settings.custom_policies_json) {
        const parsed = JSON.parse(settings.custom_policies_json);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse custom_policies_json', e);
    }
    return DEFAULT_CUSTOM_POLICIES;
  }, [settings.custom_policies_json]);

  // Derived social media links list from JSON
  const socialLinks = useMemo<SocialLink[]>(() => {
    try {
      if (settings.social_links_json) {
        const parsed = JSON.parse(settings.social_links_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse social_links_json', e);
    }
    return DEFAULT_SOCIAL_LINKS;
  }, [settings.social_links_json]);

  // Fetch live settings from backend on mount
  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setSettings((prev) => {
            const merged = { ...prev, ...data };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Backend settings endpoint unreachable; using cached defaults', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSetting = useCallback((key: keyof SiteSettings | string, value: string) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateMultipleSettings = useCallback((patch: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveSettingsToBackend = useCallback(async (overrideSettings?: SiteSettings): Promise<boolean> => {
    const toSave = overrideSettings || settings;
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });

      if (!res.ok) {
        throw new Error(`Failed to save settings: ${res.statusText}`);
      }
      return true;
    } catch (err) {
      console.error('Error saving settings to backend:', err);
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    setSettings(DEFAULT_SITE_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SITE_SETTINGS));
    return await saveSettingsToBackend(DEFAULT_SITE_SETTINGS);
  }, [saveSettingsToBackend]);

  // Add new Custom Policy
  const addCustomPolicy = useCallback(async (policy: Omit<CustomPolicy, 'id'>): Promise<boolean> => {
    const newPolicy: CustomPolicy = {
      ...policy,
      id: `policy-${Date.now()}`,
      slug: (policy.slug || policy.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
      lastUpdated: policy.lastUpdated || new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      enabled: policy.enabled ?? true,
    };
    const updatedList = [...customPolicies, newPolicy];
    const newJson = JSON.stringify(updatedList);
    const updatedSettings = { ...settings, custom_policies_json: newJson };
    setSettings(updatedSettings);
    return await saveSettingsToBackend(updatedSettings);
  }, [customPolicies, settings, saveSettingsToBackend]);

  // Update existing Custom Policy
  const updateCustomPolicy = useCallback(async (id: string, updated: Partial<CustomPolicy>): Promise<boolean> => {
    const updatedList = customPolicies.map((p) => (p.id === id ? { ...p, ...updated } : p));
    const newJson = JSON.stringify(updatedList);
    const updatedSettings = { ...settings, custom_policies_json: newJson };
    setSettings(updatedSettings);
    return await saveSettingsToBackend(updatedSettings);
  }, [customPolicies, settings, saveSettingsToBackend]);

  // Delete Custom Policy
  const deleteCustomPolicy = useCallback(async (id: string): Promise<boolean> => {
    const updatedList = customPolicies.filter((p) => p.id !== id);
    const newJson = JSON.stringify(updatedList);
    const updatedSettings = { ...settings, custom_policies_json: newJson };
    setSettings(updatedSettings);
    return await saveSettingsToBackend(updatedSettings);
  }, [customPolicies, settings, saveSettingsToBackend]);

  // Add new Social Link
  const addSocialLink = useCallback(async (link: Omit<SocialLink, 'id'>): Promise<boolean> => {
    const newLink: SocialLink = {
      ...link,
      id: `social-${Date.now()}`,
      active: link.active ?? true,
    };
    const updatedList = [...socialLinks, newLink];
    const newJson = JSON.stringify(updatedList);
    const updatedSettings = { ...settings, social_links_json: newJson };
    setSettings(updatedSettings);
    return await saveSettingsToBackend(updatedSettings);
  }, [socialLinks, settings, saveSettingsToBackend]);

  // Update existing Social Link
  const updateSocialLink = useCallback(async (id: string, updated: Partial<SocialLink>): Promise<boolean> => {
    const updatedList = socialLinks.map((s) => (s.id === id ? { ...s, ...updated } : s));
    const newJson = JSON.stringify(updatedList);
    const updatedSettings = { ...settings, social_links_json: newJson };
    setSettings(updatedSettings);
    return await saveSettingsToBackend(updatedSettings);
  }, [socialLinks, settings, saveSettingsToBackend]);

  // Delete Social Link
  const deleteSocialLink = useCallback(async (id: string): Promise<boolean> => {
    const updatedList = socialLinks.filter((s) => s.id !== id);
    const newJson = JSON.stringify(updatedList);
    const updatedSettings = { ...settings, social_links_json: newJson };
    setSettings(updatedSettings);
    return await saveSettingsToBackend(updatedSettings);
  }, [socialLinks, settings, saveSettingsToBackend]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        customPolicies,
        socialLinks,
        updateSetting,
        updateMultipleSettings,
        saveSettingsToBackend,
        resetToDefaults,
        addCustomPolicy,
        updateCustomPolicy,
        deleteCustomPolicy,
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        isLoading,
        isSaving,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
