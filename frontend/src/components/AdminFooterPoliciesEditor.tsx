import React, { useState, useRef } from 'react';
import {
  Save,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Truck,
  FileText,
  Phone,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Building,
  Scale,
  Lock,
  Globe,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Layers,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { useSettings, SiteSettings, CustomPolicy, SocialLink } from '../context/SettingsContext';
import { RichTextToolbar } from './RichTextToolbar';
import { renderFormattedText } from '../utils/textFormatter';

interface AdminFooterPoliciesEditorProps {
  onNavigate?: (page: string, param?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

type PolicySubTab = 'branding' | 'value_props' | 'refund' | 'shipping' | 'privacy' | 'terms' | 'grievance' | 'custom_policies';

interface PolicyRichTextareaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  helperText?: string;
}

const PolicyRichTextarea: React.FC<PolicyRichTextareaProps> = ({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  helperText,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsert = (prefix: string, suffix: string, defaultPlaceholder: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange((value ? value + '\n' : '') + prefix + defaultPlaceholder + suffix);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = prefix + (selected || defaultPlaceholder) + suffix;
    const newVal = value.substring(0, start) + replacement + value.substring(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      const newCursor = start + prefix.length + (selected ? selected.length : defaultPlaceholder.length);
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
        >
          {showPreview ? '✏️ Edit Text' : '👁️ Preview Formatted'}
        </button>
      </div>

      <RichTextToolbar
        onInsert={handleInsert}
        isPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
      />

      {showPreview ? (
        <div className="p-3.5 rounded-b-xl border border-t-0 border-neutral-300 dark:border-[#382B21] bg-neutral-50/70 dark:bg-[#1A1410] min-h-[85px] leading-relaxed">
          {renderFormattedText(value) || <span className="text-xs text-neutral-400 italic">No text entered yet.</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2 rounded-b-xl border border-t-0 border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs leading-relaxed outline-none focus:ring-2 focus:ring-rose-500 font-sans"
        />
      )}
      {helperText && (
        <p className="text-[10px] text-neutral-400 italic mt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export const AdminFooterPoliciesEditor: React.FC<AdminFooterPoliciesEditorProps> = ({ onNavigate, showToast }) => {
  const {
    settings,
    customPolicies,
    socialLinks,
    updateMultipleSettings,
    saveSettingsToBackend,
    resetToDefaults,
    addCustomPolicy,
    updateCustomPolicy,
    deleteCustomPolicy,
    addSocialLink,
    updateSocialLink,
    deleteSocialLink,
    isSaving,
  } = useSettings();

  const [activeSubTab, setActiveSubTab] = useState<PolicySubTab>('branding');
  const [localDraft, setLocalDraft] = useState<SiteSettings>({ ...settings });
  const [dirty, setDirty] = useState(false);

  // Social Links Form modal state
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [socialForm, setSocialForm] = useState<{
    platform: SocialLink['platform'];
    label: string;
    url: string;
    active: boolean;
  }>({
    platform: 'twitter',
    label: 'Twitter / X',
    url: '',
    active: true,
  });

  const handleOpenAddSocial = () => {
    setEditingSocialId(null);
    setSocialForm({
      platform: 'twitter',
      label: 'Twitter / X',
      url: 'https://x.com/',
      active: true,
    });
    setIsSocialModalOpen(true);
  };

  const handleOpenEditSocial = (s: SocialLink) => {
    setEditingSocialId(s.id);
    setSocialForm({
      platform: s.platform,
      label: s.label,
      url: s.url,
      active: s.active,
    });
    setIsSocialModalOpen(true);
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialForm.url.trim()) {
      showToast('Please enter a valid URL or handle.', 'error');
      return;
    }
    if (editingSocialId) {
      const ok = await updateSocialLink(editingSocialId, {
        platform: socialForm.platform,
        label: socialForm.label.trim(),
        url: socialForm.url.trim(),
        active: socialForm.active,
      });
      if (ok) showToast('Social channel updated successfully!', 'success');
    } else {
      const ok = await addSocialLink({
        platform: socialForm.platform,
        label: socialForm.label.trim() || socialForm.platform,
        url: socialForm.url.trim(),
        active: socialForm.active,
      });
      if (ok) showToast('New social channel added to footer!', 'success');
    }
    setIsSocialModalOpen(false);
  };

  const handleDeleteSocial = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this social link from the footer?')) {
      const ok = await deleteSocialLink(id);
      if (ok) showToast('Social link removed.', 'info');
    }
  };

  const handleToggleSocial = async (s: SocialLink) => {
    await updateSocialLink(s.id, { active: !s.active });
    showToast(`${s.label} ${s.active ? 'hidden from' : 'activated in'} footer`, 'info');
  };

  const getSocialPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'twitter':
      case 'x':
        return <Twitter className="w-4 h-4 text-sky-500" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-700" />;
      case 'pinterest':
        return <Share2 className="w-4 h-4 text-red-700" />;
      default:
        return <Globe className="w-4 h-4 text-neutral-400" />;
    }
  };

  // Custom Policy Form modal/card state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState<{
    title: string;
    slug: string;
    subtitle: string;
    badge: string;
    content: string;
    enabled: boolean;
  }>({
    title: '',
    slug: '',
    subtitle: '',
    badge: '',
    content: '',
    enabled: true,
  });

  // Sync draft when settings change from external source
  React.useEffect(() => {
    setLocalDraft({ ...settings });
  }, [settings]);

  const handleChange = (key: keyof SiteSettings, value: string) => {
    setLocalDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      updateMultipleSettings(localDraft);
      const success = await saveSettingsToBackend(localDraft);
      if (success) {
        showToast('Footer & Policy settings saved and published to storefront!', 'success', 3500);
        setDirty(false);
      } else {
        showToast('Failed to save settings. Please try again.', 'error');
      }
    } catch (err: any) {
      showToast('Error saving settings: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all branding, footer, and policy pages to Aura Luxe factory defaults?')) {
      const ok = await resetToDefaults();
      if (ok) {
        showToast('Reset to Aura Luxe default policies successfully!', 'success');
        setDirty(false);
      }
    }
  };

  // Open modal to add new policy
  const handleOpenAddModal = () => {
    setEditingPolicyId(null);
    setPolicyForm({
      title: '',
      slug: '',
      subtitle: '',
      badge: 'Statutory Compliance',
      content: '',
      enabled: true,
    });
    setIsPolicyModalOpen(true);
  };

  // Open modal to edit existing custom policy
  const handleOpenEditModal = (p: CustomPolicy) => {
    setEditingPolicyId(p.id);
    setPolicyForm({
      title: p.title,
      slug: p.slug,
      subtitle: p.subtitle,
      badge: p.badge || 'Statutory Compliance',
      content: p.content,
      enabled: p.enabled,
    });
    setIsPolicyModalOpen(true);
  };

  // Save Custom Policy
  const handleSaveCustomPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.title.trim()) {
      showToast('Policy title is required', 'error');
      return;
    }

    try {
      if (editingPolicyId) {
        await updateCustomPolicy(editingPolicyId, policyForm);
        showToast(`Policy "${policyForm.title}" updated successfully!`, 'success');
      } else {
        await addCustomPolicy(policyForm);
        showToast(`New Policy "${policyForm.title}" created & published!`, 'success');
      }
      setIsPolicyModalOpen(false);
    } catch (err: any) {
      showToast('Failed to save custom policy: ' + (err.message || 'Error'), 'error');
    }
  };

  // Delete Custom Policy
  const handleDeletePolicy = async (p: CustomPolicy) => {
    if (window.confirm(`Are you sure you want to delete policy "${p.title}"? This cannot be undone.`)) {
      try {
        await deleteCustomPolicy(p.id);
        showToast(`Policy "${p.title}" deleted.`, 'info');
      } catch (err: any) {
        showToast('Failed to delete policy: ' + (err.message || 'Error'), 'error');
      }
    }
  };

  // Toggle Custom Policy Active / Inactive
  const handleTogglePolicy = async (p: CustomPolicy) => {
    try {
      await updateCustomPolicy(p.id, { enabled: !p.enabled });
      showToast(`Policy "${p.title}" is now ${!p.enabled ? 'Active on Storefront' : 'Hidden as Draft'}`, 'info');
    } catch (err: any) {
      showToast('Error updating policy status', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-[#16100C] rounded-3xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden shadow-sm space-y-6 p-6 sm:p-8 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-[#2C211A]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
            Storefront &amp; Compliance Management
          </span>
          <h2 className="text-xl sm:text-2xl font-serif text-neutral-900 dark:text-[#EDE4DA] mt-1.5">
            Footer, Legal &amp; Policies CMS
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time customization of store branding, trust badges, customer concierge, and statutory legal disclosures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('policy', 'refund-policy')}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#251D18] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Preview Storefront</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 hover:bg-rose-100/60 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              dirty
                ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Publishing...' : dirty ? 'Publish Changes *' : 'Published'}</span>
          </button>
        </div>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-neutral-100 dark:border-[#2C211A] text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveSubTab('branding')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'branding'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
              : 'bg-neutral-50 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Brand &amp; Concierge</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('value_props')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'value_props'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
              : 'bg-neutral-50 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>4 Trust Badges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('refund')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'refund'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
              : 'bg-neutral-50 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refund &amp; Return</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('shipping')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'shipping'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
              : 'bg-neutral-50 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Shipping &amp; Transit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('privacy')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'privacy'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
              : 'bg-neutral-50 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy &amp; Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('terms')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'terms'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
              : 'bg-neutral-50 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Service</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('grievance')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'grievance'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
              : 'bg-neutral-50 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Grievance Officer</span>
        </button>

        {/* 8TH TAB: CUSTOM POLICIES & COMPLIANCE */}
        <button
          type="button"
          onClick={() => setActiveSubTab('custom_policies')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'custom_policies'
              ? 'bg-purple-900 text-white font-bold shadow-xs'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100/70 border border-purple-200 dark:border-purple-800/60'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Custom Policies ({customPolicies.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: BRANDING & CONCIERGE */}
      {activeSubTab === 'branding' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Storefront Brand Name
              </label>
              <input
                type="text"
                value={localDraft.site_name}
                onChange={(e) => handleChange('site_name', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Copyright Notice Text
              </label>
              <input
                type="text"
                value={localDraft.copyright_text}
                onChange={(e) => handleChange('copyright_text', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Brand Mission / Footer Tagline
            </label>
            <textarea
              rows={2}
              value={localDraft.brand_tagline}
              onChange={(e) => handleChange('brand_tagline', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Concierge Phone Hotline
              </label>
              <input
                type="text"
                value={localDraft.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                value={localDraft.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Support Hours
              </label>
              <input
                type="text"
                value={localDraft.contact_hours}
                onChange={(e) => handleChange('contact_hours', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Central Registered Warehouse Address
            </label>
            <input
              type="text"
              value={localDraft.warehouse_address}
              onChange={(e) => handleChange('warehouse_address', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* Dynamic Social Media Channels Manager */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E1611] border border-neutral-200 dark:border-[#382B21] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-[#2C211A]">
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Storefront Footer Social Channels ({socialLinks.length})</span>
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Manage all social handles displayed in the footer (Instagram, Twitter / X, YouTube, WhatsApp, Pinterest, LinkedIn, TikTok, Threads, etc.).
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddSocial}
                className="px-3 py-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Social Channel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {socialLinks.map((s) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                    s.active
                      ? 'bg-white dark:bg-[#251D18] border-neutral-200 dark:border-[#382B21] shadow-2xs'
                      : 'bg-neutral-100/70 dark:bg-[#1A1410] border-neutral-200/60 dark:border-neutral-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#1C1510] flex items-center justify-center shrink-0">
                      {getSocialPlatformIcon(s.platform)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {s.label}
                        </span>
                        {!s.active && (
                          <span className="text-[9px] uppercase px-1 py-0.2 bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded font-medium">
                            Hidden
                          </span>
                        )}
                      </div>
                      <a
                        href={s.url.startsWith('http') ? s.url : `https://${s.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10.5px] text-neutral-400 hover:text-rose-500 truncate block max-w-[140px]"
                        title={s.url}
                      >
                        {s.url}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSocial(s)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        s.active
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                      title={s.active ? 'Active on footer (click to hide)' : 'Hidden (click to show)'}
                    >
                      {s.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditSocial(s)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#201813] text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
                      title="Edit Link"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSocial(s.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition cursor-pointer"
                      title="Delete Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Consumer Protection / Compliance Note
            </label>
            <input
              type="text"
              value={localDraft.compliance_note}
              onChange={(e) => handleChange('compliance_note', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 4 TRUST VALUE PROPS */}
      {activeSubTab === 'value_props' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            These four badges appear directly above the footer across all storefront pages to establish luxury authority and reassure beauty shoppers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Prop 1 */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#201813] border border-neutral-200 dark:border-[#382B21] space-y-3">
              <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-400 text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Value Proposition #1 (Ingredients)</span>
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={localDraft.value_prop_1_title}
                  onChange={(e) => handleChange('value_prop_1_title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={localDraft.value_prop_1_subtitle}
                  onChange={(e) => handleChange('value_prop_1_subtitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Prop 2 */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#201813] border border-neutral-200 dark:border-[#382B21] space-y-3">
              <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-400 text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Value Proposition #2 (Clinical Safety)</span>
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={localDraft.value_prop_2_title}
                  onChange={(e) => handleChange('value_prop_2_title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={localDraft.value_prop_2_subtitle}
                  onChange={(e) => handleChange('value_prop_2_subtitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Prop 3 */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#201813] border border-neutral-200 dark:border-[#382B21] space-y-3">
              <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-400 text-xs">
                <Truck className="w-4 h-4" />
                <span>Value Proposition #3 (Logistics)</span>
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={localDraft.value_prop_3_title}
                  onChange={(e) => handleChange('value_prop_3_title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={localDraft.value_prop_3_subtitle}
                  onChange={(e) => handleChange('value_prop_3_subtitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Prop 4 */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#201813] border border-neutral-200 dark:border-[#382B21] space-y-3">
              <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-400 text-xs">
                <HeartHandshake className="w-4 h-4" />
                <span>Value Proposition #4 (Ethics &amp; PETA)</span>
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={localDraft.value_prop_4_title}
                  onChange={(e) => handleChange('value_prop_4_title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={localDraft.value_prop_4_subtitle}
                  onChange={(e) => handleChange('value_prop_4_subtitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REFUND & CANCELLATION */}
      {activeSubTab === 'refund' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Policy Document Title
              </label>
              <input
                type="text"
                value={localDraft.refund_policy_title}
                onChange={(e) => handleChange('refund_policy_title', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Last Revision Date Label
              </label>
              <input
                type="text"
                value={localDraft.refund_policy_last_updated}
                onChange={(e) => handleChange('refund_policy_last_updated', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 space-y-3">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Customer Guarantee Highlight Banner</span>
            </span>
            <div>
              <label className="block text-[11px] text-emerald-800 dark:text-emerald-400 mb-1 font-semibold">
                Guarantee Headline
              </label>
              <input
                type="text"
                value={localDraft.refund_policy_guarantee_badge}
                onChange={(e) => handleChange('refund_policy_guarantee_badge', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#1E1611] text-neutral-900 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <PolicyRichTextarea
                label="Guarantee Terms & Customer Promise"
                rows={2}
                value={localDraft.refund_policy_guarantee_text}
                onChange={(val) => handleChange('refund_policy_guarantee_text', val)}
              />
            </div>
          </div>

          <div>
            <PolicyRichTextarea
              label="1. Order Cancellation Clause"
              rows={3}
              value={localDraft.refund_policy_cancellation_terms}
              onChange={(val) => handleChange('refund_policy_cancellation_terms', val)}
            />
          </div>

          <div>
            <PolicyRichTextarea
              label="2. Cosmetic Hygiene & Tamper Seal Policy"
              rows={3}
              value={localDraft.refund_policy_hygiene_seal}
              onChange={(val) => handleChange('refund_policy_hygiene_seal', val)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <PolicyRichTextarea
                label="3a. Prepaid Refund Timeline (Razorpay / UPI / Cards)"
                rows={2}
                value={localDraft.refund_policy_timeline_prepaid}
                onChange={(val) => handleChange('refund_policy_timeline_prepaid', val)}
              />
            </div>
            <div>
              <PolicyRichTextarea
                label="3b. Cash On Delivery (COD) Refund Timeline"
                rows={2}
                value={localDraft.refund_policy_timeline_cod}
                onChange={(val) => handleChange('refund_policy_timeline_cod', val)}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SHIPPING & DELIVERY */}
      {activeSubTab === 'shipping' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Policy Document Title
              </label>
              <input
                type="text"
                value={localDraft.shipping_policy_title}
                onChange={(e) => handleChange('shipping_policy_title', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Primary Courier Partner Name
              </label>
              <input
                type="text"
                value={localDraft.shipping_policy_courier_partner}
                onChange={(e) => handleChange('shipping_policy_courier_partner', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Fulfillment Hub &amp; Temperature-Controlled Storage Disclosure
            </label>
            <input
              type="text"
              value={localDraft.shipping_policy_hub_location}
              onChange={(e) => handleChange('shipping_policy_hub_location', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Metro Cities Turnaround (Days)
              </label>
              <input
                type="text"
                value={localDraft.shipping_policy_metro_tat}
                onChange={(e) => handleChange('shipping_policy_metro_tat', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Tier 2/3 Cities Turnaround (Days)
              </label>
              <input
                type="text"
                value={localDraft.shipping_policy_tier2_tat}
                onChange={(e) => handleChange('shipping_policy_tier2_tat', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Same-Day Dispatch Cutoff
              </label>
              <input
                type="text"
                value={localDraft.shipping_policy_same_day_cutoff}
                onChange={(e) => handleChange('shipping_policy_same_day_cutoff', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div>
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                Free Shipping Threshold Amount (₹)
              </label>
              <input
                type="number"
                value={localDraft.shipping_policy_free_threshold}
                onChange={(e) => handleChange('shipping_policy_free_threshold', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#1E1611] text-neutral-900 dark:text-white text-xs font-bold"
              />
              <span className="text-[10px] text-amber-700 dark:text-amber-400">Cart displays Free Shipping banner above this amount</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={localDraft.shipping_policy_standard_fee}
                onChange={(e) => handleChange('shipping_policy_standard_fee', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#1E1611] text-neutral-900 dark:text-white text-xs font-bold"
              />
              <span className="text-[10px] text-amber-700 dark:text-amber-400">Charged on orders below the free shipping threshold</span>
            </div>
          </div>

          <div>
            <PolicyRichTextarea
              label="Live Courier Tracking & SMS Protocol"
              rows={2}
              value={localDraft.shipping_policy_tracking_info}
              onChange={(val) => handleChange('shipping_policy_tracking_info', val)}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PRIVACY & DATA SECURITY */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={localDraft.privacy_policy_title}
                onChange={(e) => handleChange('privacy_policy_title', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Statutory Compliance Act
              </label>
              <input
                type="text"
                value={localDraft.privacy_policy_compliance_act}
                onChange={(e) => handleChange('privacy_policy_compliance_act', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div>
            <PolicyRichTextarea
              label="1. Information We Collect"
              rows={3}
              value={localDraft.privacy_policy_data_collected}
              onChange={(val) => handleChange('privacy_policy_data_collected', val)}
            />
          </div>

          <div>
            <PolicyRichTextarea
              label="2. Payment Card, UPI & PCI-DSS Gateway Security"
              rows={3}
              value={localDraft.privacy_policy_payment_security}
              onChange={(val) => handleChange('privacy_policy_payment_security', val)}
            />
          </div>

          <div>
            <PolicyRichTextarea
              label="3. Non-Disclosure & Logistics Partner Data Sharing"
              rows={3}
              value={localDraft.privacy_policy_non_disclosure}
              onChange={(val) => handleChange('privacy_policy_non_disclosure', val)}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 6: TERMS OF SERVICE */}
      {activeSubTab === 'terms' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={localDraft.terms_policy_title}
                onChange={(e) => handleChange('terms_policy_title', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Document Subtitle
              </label>
              <input
                type="text"
                value={localDraft.terms_policy_subtitle}
                onChange={(e) => handleChange('terms_policy_subtitle', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div>
            <PolicyRichTextarea
              label="1. Cosmetic Suitability & 24-Hour Skin Patch Test Advisory"
              rows={3}
              value={localDraft.terms_policy_patch_test}
              onChange={(val) => handleChange('terms_policy_patch_test', val)}
            />
          </div>

          <div>
            <PolicyRichTextarea
              label="2. Catalog Pricing, GST & Currency Policy"
              rows={3}
              value={localDraft.terms_policy_pricing_currency}
              onChange={(val) => handleChange('terms_policy_pricing_currency', val)}
            />
          </div>

          <div>
            <PolicyRichTextarea
              label="3. Governing Law & Legal Jurisdiction"
              rows={2}
              value={localDraft.terms_policy_jurisdiction}
              onChange={(val) => handleChange('terms_policy_jurisdiction', val)}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 7: GRIEVANCE REDRESSAL OFFICER */}
      {activeSubTab === 'grievance' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-900/60 text-xs text-purple-950 dark:text-purple-300">
            <strong>Mandatory Consumer Protection Disclosure:</strong> As per Rule 5(9) of the Consumer Protection (E-Commerce) Rules 2020, every e-commerce entity is legally required to appoint a Grievance Officer and publish their official contact coordinates.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Designated Officer Full Name
              </label>
              <input
                type="text"
                value={localDraft.grievance_policy_officer_name}
                onChange={(e) => handleChange('grievance_policy_officer_name', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Designation / Title
              </label>
              <input
                type="text"
                value={localDraft.grievance_policy_officer_designation}
                onChange={(e) => handleChange('grievance_policy_officer_designation', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Official Grievance Email
              </label>
              <input
                type="email"
                value={localDraft.grievance_policy_officer_email}
                onChange={(e) => handleChange('grievance_policy_officer_email', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Officer Phone Hotline
              </label>
              <input
                type="text"
                value={localDraft.grievance_policy_officer_phone}
                onChange={(e) => handleChange('grievance_policy_officer_phone', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Statutory Turnaround SLA
            </label>
            <input
              type="text"
              value={localDraft.grievance_policy_turnaround_sla}
              onChange={(e) => handleChange('grievance_policy_turnaround_sla', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Registered Physical Corporate / Warehouse Address
            </label>
            <input
              type="text"
              value={localDraft.grievance_policy_warehouse_address}
              onChange={(e) => handleChange('grievance_policy_warehouse_address', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 8: DYNAMIC CUSTOM POLICIES & COMPLIANCE */}
      {activeSubTab === 'custom_policies' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
            <div>
              <h3 className="font-semibold text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Custom Policies &amp; Compliance Documents</span>
              </h3>
              <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                Add specialized legal disclosures (e.g., Sustainability Audits, AYUSH / FDA Certification, Influencer Endorsements).
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Policy</span>
            </button>
          </div>

          {/* List of Custom Policies */}
          <div className="space-y-3">
            {customPolicies.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 dark:bg-[#201813] rounded-2xl border border-dashed border-neutral-300 dark:border-[#382B21] text-neutral-500 text-xs">
                No custom policies added yet. Click &quot;Add New Policy&quot; above to create one.
              </div>
            ) : (
              customPolicies.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#201813] border border-neutral-200 dark:border-[#382B21] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-900 dark:text-white text-sm">
                        {p.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 font-semibold">
                        {p.badge || 'Compliance'}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        /policy/{p.slug}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.enabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {p.enabled ? 'Active on Storefront' : 'Draft / Hidden'}
                      </span>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      {p.subtitle || 'Custom statutory disclosure'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {onNavigate && p.enabled && (
                      <button
                        type="button"
                        onClick={() => onNavigate('policy', p.slug)}
                        title="View on Storefront"
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 hover:bg-white dark:hover:bg-[#2A1E17] transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleTogglePolicy(p)}
                      title={p.enabled ? 'Hide from Storefront' : 'Publish to Storefront'}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        p.enabled
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'border-neutral-300 text-neutral-400 bg-neutral-100 dark:bg-[#1A1410]'
                      }`}
                    >
                      {p.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#1E1611] text-neutral-800 dark:text-neutral-200 hover:border-neutral-400 font-semibold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-neutral-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePolicy(p)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CUSTOM POLICY */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1410] rounded-3xl max-w-2xl w-full border border-neutral-200 dark:border-[#2C211A] shadow-2xl p-6 sm:p-8 space-y-5 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
                    {editingPolicyId ? 'Edit Custom Policy' : 'Create New Policy / Compliance'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Will appear in the storefront footer and policy navigation bar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-[#251D18] text-neutral-400 hover:text-neutral-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPolicy} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Policy Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sustainability & Ethical Sourcing"
                    value={policyForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setPolicyForm((prev) => ({
                        ...prev,
                        title,
                        slug: prev.slug && editingPolicyId ? prev.slug : slug,
                      }));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. sustainability-standards"
                    value={policyForm.slug}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs font-mono outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Subtitle / Short Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Recyclable Packaging & Vegan Actives"
                    value={policyForm.subtitle}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Environmental Standards"
                    value={policyForm.badge}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <PolicyRichTextarea
                  label="Full Policy Content (Clauses, Terms & Disclosures) *"
                  rows={8}
                  placeholder={`Write the complete policy text here...\n\n### 1. Purpose & Standards\nDetail the statutory or brand commitment.\n\n### 2. Protocols & Audits\n- Testing protocol\n- Review [Official Certificate](https://example.com)`}
                  value={policyForm.content}
                  onChange={(val) => setPolicyForm((prev) => ({ ...prev, content: val }))}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="policyEnabled"
                  checked={policyForm.enabled}
                  onChange={(e) => setPolicyForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="policyEnabled" className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  Publish to Storefront (Show in Footer &amp; Policy sidebar)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-[#2C211A]">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#382B21] text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#251D18] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingPolicyId ? 'Update Policy' : 'Create & Publish Policy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOCIAL MEDIA LINK MODAL */}
      {isSocialModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsSocialModalOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 dark:border-[#2C211A] p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                    {editingSocialId ? 'Edit Social Channel' : 'Add New Social Channel'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">Configure footer social icons & direct links</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSocial} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                  Social Platform <span className="text-red-500">*</span>
                </label>
                <select
                  value={socialForm.platform}
                  onChange={(e) => {
                    const platform = e.target.value as SocialLink['platform'];
                    let defaultLabel = 'Social Channel';
                    let defaultUrl = 'https://';
                    if (platform === 'twitter') { defaultLabel = 'Twitter / X'; defaultUrl = 'https://x.com/'; }
                    else if (platform === 'instagram') { defaultLabel = 'Instagram'; defaultUrl = 'https://instagram.com/'; }
                    else if (platform === 'facebook') { defaultLabel = 'Facebook'; defaultUrl = 'https://facebook.com/'; }
                    else if (platform === 'youtube') { defaultLabel = 'YouTube'; defaultUrl = 'https://youtube.com/'; }
                    else if (platform === 'pinterest') { defaultLabel = 'Pinterest'; defaultUrl = 'https://pinterest.com/'; }
                    else if (platform === 'tiktok') { defaultLabel = 'TikTok'; defaultUrl = 'https://tiktok.com/@'; }
                    else if (platform === 'threads') { defaultLabel = 'Threads'; defaultUrl = 'https://threads.net/@'; }
                    else if (platform === 'linkedin') { defaultLabel = 'LinkedIn'; defaultUrl = 'https://linkedin.com/company/'; }
                    else if (platform === 'whatsapp') { defaultLabel = 'WhatsApp Care'; defaultUrl = 'https://wa.me/919900876787'; }

                    setSocialForm((prev) => ({
                      ...prev,
                      platform,
                      label: prev.label === 'Twitter / X' || prev.label === 'Instagram' || prev.label === 'Facebook' || prev.label === 'YouTube' || !prev.label ? defaultLabel : prev.label,
                      url: defaultUrl,
                    }));
                  }}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="tiktok">TikTok</option>
                  <option value="threads">Threads</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="whatsapp">WhatsApp Hotline</option>
                  <option value="custom">Custom Platform (Global Web)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                  Display Label / Tooltip <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow our Twitter / X"
                  value={socialForm.label}
                  onChange={(e) => setSocialForm((prev) => ({ ...prev, label: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                  Profile URL / Direct Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://x.com/auraluxe_beauty"
                  value={socialForm.url}
                  onChange={(e) => setSocialForm((prev) => ({ ...prev, url: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="socialActive"
                  checked={socialForm.active}
                  onChange={(e) => setSocialForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="socialActive" className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  Visible in Storefront Footer
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-[#2C211A]">
                <button
                  type="button"
                  onClick={() => setIsSocialModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 dark:border-[#382B21] text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#251D18] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSocialId ? 'Update Channel' : 'Add to Footer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Sticky Save Prompt when dirty */}
      {dirty && (
        <div className="pt-4 border-t border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You have unsaved policy changes. Remember to click &quot;Publish Changes&quot; to push updates to the live storefront.</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-2xs shrink-0 cursor-pointer"
          >
            {isSaving ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      )}
    </div>
  );
};
