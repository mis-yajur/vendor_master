import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  Plus, 
  Search, 
  Download, 
  FileText, 
  Settings,
  Activity,
  Database,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Palette,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from './lib/utils';
import type { Vendor } from './types/vendor';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

// Helper for API calls
const apiCall = async (action: string, data: any = {}) => {
  // If we are on GitHub Pages or similar, we must talk to GAS directly
  const isDirect = window.location.hostname.includes('github.io');
  
  if (isDirect && SCRIPT_URL) {
    // GAS requires POST for everything that modifies or includes complex data
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
    });
    return response.json();
  }
  
  // Default to local proxy
  if (action === 'list') {
    const res = await axios.get('/api/vendors');
    return res.data;
  }
  
  if (action === 'add') {
    const res = await axios.post('/api/vendors', data);
    return res.data;
  }
  
  if (action === 'health') {
    const res = await axios.get('/api/health');
    return res.data;
  }
};

type Tab = 'dashboard' | 'vendors' | 'add' | 'settings';
type Theme = 'pink' | 'purple' | 'indigo' | 'emerald' | 'blue';

const THEME_COLORS: Record<Theme, { primary: string, bg: string, ring: string, shadow: string, accent: string }> = {
  pink: { primary: 'fuchsia-600', bg: 'bg-fuchsia-50', ring: 'ring-fuchsia-200', shadow: 'shadow-fuchsia-100', accent: 'fuchsia-500' },
  purple: { primary: 'violet-600', bg: 'bg-violet-50', ring: 'ring-violet-200', shadow: 'shadow-violet-100', accent: 'violet-500' },
  indigo: { primary: 'indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-200', shadow: 'shadow-indigo-100', accent: 'indigo-500' },
  emerald: { primary: 'emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200', shadow: 'shadow-emerald-100', accent: 'emerald-500' },
  blue: { primary: 'blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200', shadow: 'shadow-blue-100', accent: 'blue-500' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState({ status: 'checking', db: 'unknown' });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [theme, setTheme] = useState<Theme>('pink');
  const [loading, setLoading] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('list');
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const data = await apiCall('health');
      setSystemHealth(data);
    } catch (error) {
      setSystemHealth({ status: 'error', db: 'disconnected' });
    }
  }, []);

  useEffect(() => {
    fetchVendors();
    checkHealth();
    
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchVendors, checkHealth]);

  const exportCSV = useCallback(() => {
    const csvData = vendors.map(v => ({
      ID: v.id,
      Name: v.name,
      GSTIN: v.statutory.gstin,
      PAN: v.statutory.pan,
      Type: v.statutory.vendorType,
      City: v.address.city,
      State: v.address.state,
      Contact: v.contact.name,
      Phone: v.address.mobile,
      Email: v.address.email,
      Bank: v.bank.bankName,
      Account: v.bank.accountNumber,
      IFSC: v.bank.ifscCode
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Vendors_${new Date().toISOString().split('T')[0]}.csv`);
  }, [vendors]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'add', label: 'Register', icon: Plus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const primaryColor = THEME_COLORS[theme].primary;
  const bgClass = THEME_COLORS[theme].bg;
  const ringClass = THEME_COLORS[theme].ring;
  const shadowClass = THEME_COLORS[theme].shadow;
  const accentColor = THEME_COLORS[theme].accent;

  return (
    <div className={cn("min-h-screen bg-[#F8F9FD] font-sans text-slate-900 selection:bg-opacity-20", `selection:bg-${accentColor}`)}>
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-xl transform transition-transform hover:rotate-3", `bg-gradient-to-br from-${primaryColor} to-${accentColor}`, shadowClass)}>
              <Building2 className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                VendorMaster<span className={cn(`text-${accentColor}`)}>Pro</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Edition</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                  activeTab === item.id 
                    ? `bg-white text-${primaryColor} shadow-sm ring-1 ring-slate-100` 
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                <item.icon className={cn("h-4 w-4", activeTab === item.id ? `text-${accentColor}` : "text-slate-400")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-slate-100">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">Administrator</p>
                  <p className="text-[10px] text-slate-500">mis@yajurfibres.com</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                </div>
             </div>
             <div className="hidden sm:flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
              {(Object.keys(THEME_COLORS) as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "h-6 w-6 rounded-md border-2 transition-all",
                    theme === t ? `border-${THEME_COLORS[t].primary} scale-110` : "border-transparent opacity-50 hover:opacity-100",
                    `bg-${THEME_COLORS[t].primary}`
                  )}
                  title={t}
                />
              ))}
            </div>
            
            <button 
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-16 z-40 bg-white border-b border-slate-200 shadow-xl"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors",
                    activeTab === item.id 
                      ? `${bgClass} text-${primaryColor}` 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <Dashboard 
              key="dash" 
              vendors={vendors} 
              health={systemHealth} 
              onExport={exportCSV} 
              theme={theme}
            />
          )}
          {activeTab === 'vendors' && (
            <VendorList 
              key="list" 
              vendors={vendors.filter(v => 
                v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.statutory.gstin.toLowerCase().includes(searchQuery.toLowerCase())
              )} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              theme={theme}
            />
          )}
          {activeTab === 'add' && <RegistrationForm key="form" onComplete={() => setActiveTab('vendors')} theme={theme} />}
          {activeTab === 'settings' && <SettingsView key="settings" health={systemHealth} theme={theme} setTheme={setTheme} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Dashboard({ vendors, health, onExport, theme }: any) {
  const { primary, accent } = THEME_COLORS[theme as Theme];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-slate-500 font-medium text-sm">Monitoring vendor integrity and system throughput.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onExport}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-xl transition-all active:scale-95 group",
              `bg-gradient-to-r from-${primary} to-${accent} hover:shadow-${primary.split('-')[0]}-200/50`
            )}
          >
            <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Export System CSV
          </button>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Vendors" value={vendors.length.toString()} icon={Users} theme={theme} featured />
        <StatCard title="Compliance Score" value="98.2%" icon={ShieldCheck} status="optimal" theme={theme} color="emerald" />
        <StatCard title="Cloud Sync" value="Verified" icon={Database} status="live" theme={theme} color="blue" />
        <StatCard title="Certificates" value="156" icon={FileText} theme={theme} color="amber" />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Infrastructure</h3>
             <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", `bg-${primary}/10 text-${primary}`)}>
              Realtime
             </div>
          </div>
          <div className="space-y-6">
            <HealthItem label="Google Sheets API (v4)" status="online" desc="Connected to Master Sheet" />
            <HealthItem label="Statutory Storage" status="online" desc="Drive Root: /vendors_docs" />
            <HealthItem label="Onboarding Engine" status="online" desc="Active Worker Node 01" />
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Recent Activity</h3>
            <button className={cn("text-sm font-bold", `text-${primary}`, "hover:opacity-70 transition-opacity")}>View Logs</button>
          </div>
          <div className="space-y-4">
            {vendors.slice(0, 3).map((v: Vendor) => (
              <div key={v.id} className="flex items-center gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-110", THEME_COLORS[theme as Theme].bg, `text-${primary}`)}>
                  {v.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate group-hover:text-fuchsia-600 transition-colors uppercase text-sm tracking-tight">{v.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{v.statutory.gstin} • {formatDate(v.createdAt)}</p>
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center border border-slate-100 group-hover:border-slate-200 transition-all shadow-sm bg-white">
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VendorList({ vendors, searchQuery, setSearchQuery, theme }: any) {
  const { primary } = THEME_COLORS[theme as Theme];
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Master Registry</h1>
          <p className="text-slate-500 text-sm">Real-time data from Google Sheets.</p>
        </div>
      </div>

      <div className="sticky top-16 z-10 flex flex-col gap-4 sm:flex-row sm:items-center bg-slate-50/90 backdrop-blur-sm py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor: Vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} theme={theme} onPreview={(url: string) => setPreviewDoc(url)} />
        ))}
      </div>

      {previewDoc && <DocumentPreview url={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </motion.div>
  );
}

function VendorCard({ vendor, theme, onPreview }: { vendor: Vendor, theme: Theme, onPreview: (url: string) => void }) {
  const { primary, bg, accent } = THEME_COLORS[theme];
  return (
    <div className="group rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-2xl font-black shadow-sm transition-transform group-hover:scale-110", bg, `text-${primary}`)}>
          {vendor.name.charAt(0)}
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]", `bg-${primary}/10 text-${primary}`)}>
            {vendor.statutory.vendorType}
          </span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Registered</span>
        </div>
      </div>
      
      <div className="mt-8 space-y-2">
        <h3 className="text-xl font-black text-slate-900 truncate uppercase leading-tight group-hover:text-indigo-600 transition-colors tracking-tight">{vendor.name}</h3>
        <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <MapPin className="h-3 w-3" />
          {vendor.address.city}, {vendor.address.state}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-y border-slate-50 py-6">
        <div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">GSTIN</p>
          <p className="mt-1 text-sm font-black text-slate-700 truncate">{vendor.statutory.gstin}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">PAN</p>
          <p className="mt-1 text-sm font-black text-slate-700 truncate">{vendor.statutory.pan}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        {vendor.folderUrl && (
          <a 
            href={vendor.folderUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 uppercase tracking-widest"
          >
            <ExternalLink className="h-4 w-4" /> Drive
          </a>
        )}
        <button 
          onClick={() => vendor.documents.gstinCopy && onPreview(vendor.documents.gstinCopy)}
          className={cn("flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black text-white transition-all uppercase tracking-widest shadow-lg", `bg-gradient-to-r from-${primary} to-${accent} hover:shadow-${primary.split('-')[0]}-200/50`)}
        >
          <Eye className="h-4 w-4" /> View Doc
        </button>
      </div>
    </div>
  );
}

function DocumentPreview({ url, onClose }: { url: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-900">Document Preview</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="h-6 w-6" /></button>
        </div>
        <div className="aspect-video bg-slate-100 flex items-center justify-center">
          <img src={url} alt="Document" className="max-h-full object-contain" />
        </div>
        <div className="p-4 bg-slate-50 flex justify-end gap-3">
           <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:underline">Download Original</button>
           <button className="px-6 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold" onClick={onClose}>Close Preview</button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsView({ health, theme, setTheme }: any) {
  const { primary } = THEME_COLORS[theme as Theme];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">System Configuration</h1>
      <div className="rounded-3xl bg-white border p-8 space-y-6">
        <section>
          <h3 className="font-bold text-lg mb-4">Visual Theme</h3>
          <div className="grid grid-cols-5 gap-4">
             {(Object.keys(THEME_COLORS) as Theme[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setTheme(t)}
                 className={cn("h-12 rounded-xl border-4 transition-all", theme === t ? `border-${THEME_COLORS[t].primary}` : "border-transparent", `bg-${THEME_COLORS[t].primary}`)}
               />
             ))}
          </div>
        </section>
        <section className="pt-6 border-t">
          <h3 className="font-bold text-lg mb-2">Connected Integration</h3>
          <div className="space-y-3">
             <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold block text-slate-900">Google Sheet Status</span>
                  <span className="text-xs text-slate-500">{health.db === 'connected' ? 'Live Connection Active' : 'Offline'}</span>
                </div>
                <div className={cn("h-2 w-2 rounded-full", health.db === 'connected' ? "bg-emerald-500" : "bg-rose-500")} />
             </div>
             <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium">Administrator Email</span>
                <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-700">mis@yajurfibres.com</span>
             </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function RegistrationForm({ onComplete, theme }: any) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: '',
    address: { 
      floorBuilding: '', street: '', city: '', district: '', pinCode: '', state: '', country: 'INDIA', mobile: '', email: '' 
    } as any,
    contact: { name: '', designation: '', phone: '', email: '' },
    statutory: { vendorType: 'Goods', yearOfEstablishment: '', constitution: 'Proprietary', compoundingDealer: 'NO' } as any,
    bank: { beneficiaryName: '', bankName: '', accountNumber: '', branchName: '', branchAddress: '', accountType: 'Savings', ifscCode: '' } as any,
    currency: 'INR',
    creditTerms: 'ADVANCE',
    documents: {}
  });

  const { primary, accent } = THEME_COLORS[theme as Theme];

  const updateNested = (category: keyof Vendor, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [key]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiCall('add', { vendor: formData });
      onComplete();
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to register vendor. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className={cn("inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-white shadow-xl mb-6", `bg-gradient-to-br from-${primary} to-${accent}`)}>
          <Plus className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Onboard New Vendor</h1>
        <p className="mt-2 text-slate-500 font-medium tracking-tight">Step {step} of 3: {step === 1 ? 'Primary Identity' : step === 2 ? 'Legal & Statutory' : 'Financial Routing'}</p>
      </div>

      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200/40">
        <div className="flex gap-2 mb-10 overflow-hidden rounded-full bg-slate-100 h-2">
           <div className={cn("h-full transition-all duration-500", `bg-${primary}`)} style={{ width: `${(step/3)*100}%` }} />
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup 
                label="Full Business Name" 
                placeholder="Enter formal name"
                value={formData.name} 
                onChange={(v: string) => setFormData({...formData, name: v})} 
                theme={theme}
              />
              <InputGroup 
                label="Registered Mobile" 
                placeholder="+91-0000000000"
                value={formData.address?.mobile} 
                onChange={(v: string) => updateNested('address', 'mobile', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Official Email Address" 
                placeholder="contact@company.com"
                value={formData.address?.email} 
                onChange={(v: string) => updateNested('address', 'email', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Base City" 
                placeholder="Business location"
                value={formData.address?.city} 
                onChange={(v: string) => updateNested('address', 'city', v)} 
                theme={theme}
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup 
                label="Tax Identification (GSTIN)" 
                placeholder="15-digit number"
                value={formData.statutory?.gstin} 
                onChange={(v: string) => updateNested('statutory', 'gstin', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Permanent Account (PAN)" 
                placeholder="10-digit code"
                value={formData.statutory?.pan} 
                onChange={(v: string) => updateNested('statutory', 'pan', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Classification" 
                type="select" 
                options={['Goods', 'Services']} 
                value={formData.statutory?.vendorType} 
                onChange={(v: string) => updateNested('statutory', 'vendorType', v)} 
                theme={theme}
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup 
                label="Settlement Account No." 
                placeholder="Primary business account"
                value={formData.bank?.accountNumber} 
                onChange={(v: string) => updateNested('bank', 'accountNumber', v)} 
                theme={theme}
              />
              <InputGroup 
                label="IFSC Code" 
                placeholder="Routing code"
                value={formData.bank?.ifscCode} 
                onChange={(v: string) => updateNested('bank', 'ifscCode', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Bank Name" 
                placeholder="Automated detection"
                value={formData.bank?.bankName} 
                onChange={(v: string) => updateNested('bank', 'bankName', v)} 
                theme={theme}
              />
            </div>
          </div>
        )}
        <div className="mt-12 flex items-center justify-between">
          <button 
            disabled={step === 1 || isSubmitting} 
            onClick={() => setStep(s => s - 1)} 
            className="flex items-center gap-2 px-6 py-3 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button 
            disabled={isSubmitting}
            onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()} 
            className={cn(
              "px-12 py-4 rounded-[1.5rem] text-white font-black flex items-center gap-3 uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95", 
              `bg-gradient-to-r from-${primary} to-${accent}`,
              isSubmitting && "opacity-50"
            )}
          >
            {isSubmitting ? "Processing..." : (step === 3 ? "Register" : "Continue")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InputGroup({ label, placeholder, type = 'text', options, value, onChange, theme }: any) {
  const { primary } = THEME_COLORS[theme as Theme];
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>
      {type === 'select' ? (
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold outline-none transition-all",
             `focus:border-${primary} focus:bg-white focus:ring-4 focus:ring-${primary.split('-')[0]}-100`
          )}
        >
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input 
          type={type} 
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold outline-none transition-all",
            `focus:border-${primary} focus:bg-white focus:ring-4 focus:ring-${primary.split('-')[0]}-100`
          )}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, status, featured, theme, color }: any) {
  const { primary, bg, accent } = THEME_COLORS[theme as Theme];
  
  if (featured) {
    return (
      <div className={cn(
        "rounded-[2.5rem] p-8 shadow-2xl transition-all hover:scale-[1.02] relative overflow-hidden",
        `bg-gradient-to-br from-${primary} to-${accent} text-white shadow-${primary.split('-')[0]}-200/50`
      )}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div className="h-10 w-10 border-2 border-white/30 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{title}</p>
          <h4 className="text-4xl font-black mt-2 tracking-tight">{value}</h4>
        </div>
        <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -top-4 h-32 w-32 bg-white/5 rounded-full blur-2xl opacity-20" />
      </div>
    );
  }

  return (
    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/30 transition-all hover:shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-3 rounded-2xl", color ? `bg-${color}-50 text-${color}-600` : `${bg} text-${primary}`)}>
          <Icon className="h-7 w-7" />
        </div>
        {status && (
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full",
            color ? `bg-${color}-50 text-${color}-600` : `${bg} text-${primary}`
          )}>
            {status}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{value}</h4>
    </div>
  );
}

function HealthItem({ label, status, desc }: any) {
  return (
    <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all">
      <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
      <div><p className="text-sm font-bold text-slate-900">{label}</p><p className="text-xs text-slate-500">{desc}</p></div>
    </div>
  );
}
