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
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

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
            placeholder="Search by Name, GSTIN, PAN or City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor: Vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} theme={theme} onSelect={() => setSelectedVendor(vendor)} />
        ))}
        {vendors.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No vendors found matching your criteria.</p>
          </div>
        )}
      </div>

      {selectedVendor && <VendorDetailModal vendor={selectedVendor} theme={theme} onClose={() => setSelectedVendor(null)} />}
    </motion.div>
  );
}

function VendorCard({ vendor, theme, onSelect }: { vendor: Vendor, theme: Theme, onSelect: () => void }) {
  const { primary, bg, accent } = THEME_COLORS[theme];
  return (
    <div className="group rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-2xl font-black shadow-sm transition-transform group-hover:scale-110", bg, `text-${primary}`)}>
          {vendor.name.charAt(0)}
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]", `bg-${primary}/10 text-${primary}`)}>
            {vendor.requestType}
          </span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
            {vendor.statutory.vendorType}
          </span>
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
        <button 
          onClick={onSelect}
          className={cn("flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black text-white transition-all uppercase tracking-widest shadow-lg", `bg-gradient-to-r from-${primary} to-${accent} hover:shadow-${primary.split('-')[0]}-200/50`)}
        >
          <Eye className="h-4 w-4" /> View Details
        </button>
      </div>
    </div>
  );
}

function VendorDetailModal({ vendor, theme, onClose }: { vendor: Vendor, theme: Theme, onClose: () => void }) {
  const { primary, accent, ring } = THEME_COLORS[theme];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-5xl bg-[#F8F9FD] rounded-[3rem] overflow-hidden shadow-2xl my-8">
        <div className="sticky top-0 z-10 flex items-center justify-between p-8 bg-white border-b border-slate-100">
           <div className="flex items-center gap-4">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg", `bg-gradient-to-br from-${primary} to-${accent}`)}>
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{vendor.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest", `bg-${primary}/10 text-${primary}`)}>{vendor.requestType} Request</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added {formatDate(vendor.createdAt)}</span>
                </div>
              </div>
           </div>
           <button onClick={onClose} className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shadow-sm"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-8 lg:grid-cols-3">
             {/* General & Address */}
             <DetailSection title="Address Details" icon={MapPin} theme={theme}>
               <DetailItem label="Floor/Building" value={vendor.address.floorBuilding} />
               <DetailItem label="Street" value={vendor.address.street} />
               <DetailItem label="City" value={vendor.address.city} />
               <DetailItem label="District" value={vendor.address.district} />
               <DetailItem label="Pin Code" value={vendor.address.pinCode} />
               <DetailItem label="State" value={vendor.address.state} />
               <DetailItem label="Country" value={vendor.address.country} />
               <DetailItem label="Phone" value={vendor.address.phone} />
               <DetailItem label="Fax" value={vendor.address.fax} />
               <DetailItem label="Mobile" value={vendor.address.mobile} />
               <DetailItem label="Email" value={vendor.address.email} />
             </DetailSection>

             {/* Contact & Classification */}
             <DetailSection title="Contact & Classification" icon={Users} theme={theme}>
               <DetailItem label="Contact Person" value={vendor.contact.name} />
               <DetailItem label="Designation" value={vendor.contact.designation} />
               <DetailItem label="Contact Phone" value={vendor.contact.phone} />
               <DetailItem label="Contact Fax" value={vendor.contact.fax} />
               <DetailItem label="Contact Email" value={vendor.contact.email} />
               <DetailItem label="Vendor Type" value={vendor.statutory.vendorType} />
               <DetailItem label="Constitution" value={vendor.statutory.constitution} />
               <DetailItem label="Year of Est." value={vendor.statutory.yearOfEstablishment} />
             </DetailSection>

             {/* Statutory */}
             <DetailSection title="Statutory Details" icon={ShieldCheck} theme={theme}>
               <DetailItem label="PAN" value={vendor.statutory.pan} highlighted />
               <DetailItem label="GSTIN" value={vendor.statutory.gstin} highlighted />
               <DetailItem label="CIN" value={vendor.statutory.cin} />
               <DetailItem label="MSMED Reg" value={vendor.statutory.msmedRegNo} />
               <DetailItem label="Trade License" value={vendor.statutory.tradeLicense} />
               <DetailItem label="IEC Code" value={vendor.statutory.iecNo} />
             </DetailSection>

             {/* Bank */}
             <DetailSection title="Bank Details" icon={CreditCard} theme={theme}>
               <DetailItem label="Beneficiary" value={vendor.bank.beneficiaryName} />
               <DetailItem label="Bank Name" value={vendor.bank.bankName} />
               <DetailItem label="Bank Account" value={vendor.bank.accountNumber} highlighted />
               <DetailItem label="Branch Name" value={vendor.bank.branchName} />
               <DetailItem label="Branch Address" value={vendor.bank.branchAddress} />
               <DetailItem label="IFSC Code" value={vendor.bank.ifscCode} highlighted />
               <DetailItem label="Account Type" value={vendor.bank.accountType} />
               <DetailItem label="Currency" value={vendor.currency} />
               <DetailItem label="Credit Terms" value={vendor.creditTerms} />
               <DetailItem label="Bank Email" value={vendor.bank.bankEmail} />
             </DetailSection>

             {/* Compliance */}
             <DetailSection title="Compliance & Others" icon={FileText} theme={theme}>
               <DetailItem label="TDS Exemption" value={vendor.statutory.tdsExemptionDetails} />
               <DetailItem label="PCB Consent" value={vendor.statutory.consentToOperate} />
               <DetailItem label="Labour License" value={vendor.statutory.labourLicenseNo} />
               <DetailItem label="Factory License" value={vendor.statutory.factoryLicense} />
             </DetailSection>

             {/* Attachments */}
             <DetailSection title="Mandatory Attachments" icon={Plus} theme={theme}>
               <div className="space-y-3 mt-4">
                  <AttachmentLink label="GSTIN Copy" url={vendor.documents.gstinCopy} theme={theme} />
                  <AttachmentLink label="PAN Copy" url={vendor.documents.panCopy} theme={theme} />
                  <AttachmentLink label="MSMED Copy" url={vendor.documents.msmedCopy} theme={theme} />
                  <AttachmentLink label="Cancelled Cheque" url={vendor.documents.cancelledChequeCopy} theme={theme} />
                  <AttachmentLink label="TDS Exemption" url={vendor.documents.tdsExemptionCopy} theme={theme} />
                  <AttachmentLink label="Signed Declaration" url={vendor.documents.signedDeclaration} theme={theme} />
               </div>
               {vendor.folderUrl && (
                  <a 
                    href={vendor.folderUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn("mt-6 flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-white border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-widest")}
                  >
                    <ExternalLink className="h-4 w-4" /> Open G-Drive Folder
                  </a>
               )}
             </DetailSection>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">Close</button>
           <button 
            onClick={() => window.print()}
            className={cn("px-8 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95", `bg-gradient-to-r from-${primary} to-${accent}`)}
           >
            Download Info
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailSection({ title, icon: Icon, children, theme }: any) {
  const { primary } = THEME_COLORS[theme as Theme];
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
       <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
          <Icon className={cn("h-5 w-5", `text-${primary}`)} />
          <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">{title}</h4>
       </div>
       <div className="space-y-4">
          {children}
       </div>
    </div>
  );
}

function DetailItem({ label, value, highlighted }: { label: string, value?: string, highlighted?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={cn("mt-1 text-sm font-bold", highlighted ? "text-indigo-600 font-black" : "text-slate-700")}>{value}</p>
    </div>
  );
}

function AttachmentLink({ label, url, theme }: { label: string, url?: string, theme: Theme }) {
  const { primary } = THEME_COLORS[theme];
  if (!url) return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 opacity-50 grayscale border border-slate-100 text-slate-400">
      <span className="text-xs font-bold">{label}</span>
      <span className="text-[10px] uppercase font-black tracking-widest">Missing</span>
    </div>
  );
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={cn("p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all")}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <a 
          href={url} 
          download
          className={cn("p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all")}
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
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
    requestType: 'New',
    name: '',
    address: { 
      floorBuilding: '', street: '', city: '', district: '', pinCode: '', state: '', country: 'INDIA', mobile: '', email: '', phone: '', fax: '' 
    } as any,
    contact: { name: '', designation: '', phone: '', fax: '', email: '' },
    statutory: { 
      vendorType: 'Goods', yearOfEstablishment: '', constitution: 'Proprietary', 
      cin: '', tradeLicense: '', pan: '', gstin: '', lutNo: '', 
      compoundingDealer: 'NO', msmedRegNo: '', iecNo: '', pfRegNo: '', 
      esicRegNo: '', labourLicenseNo: '', factoryLicense: '',
      tdsExemptionDetails: '', consentToOperate: '' 
    } as any,
    bank: { 
      beneficiaryName: '', bankName: '', accountNumber: '', branchName: '', branchAddress: '', 
      accountType: 'Savings', ifscCode: '', swiftIban: '', bankEmail: '' 
    } as any,
    currency: 'INR',
    creditTerms: 'NET 30',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [key]: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
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

  const totalSteps = 6;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <div className={cn("inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-white shadow-xl mb-6", `bg-gradient-to-br from-${primary} to-${accent}`)}>
          <Plus className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Onboard New Vendor</h1>
        <p className="mt-2 text-slate-500 font-medium tracking-tight">
          Step {step} of {totalSteps}: {
            step === 1 ? 'General & Address' : 
            step === 2 ? 'Contact & Classification' : 
            step === 3 ? 'Statutory Details' : 
            step === 4 ? 'Bank & Terms' :
            step === 5 ? 'Additional Compliance' : 
            'Mandatory Attachments'
          }
        </p>
      </div>

      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200/40">
        <div className="flex gap-2 mb-10 overflow-hidden rounded-full bg-slate-100 h-2">
           <div className={cn("h-full transition-all duration-500", `bg-${primary}`)} style={{ width: `${(step/totalSteps)*100}%` }} />
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup 
                label="Request Type" 
                type="select"
                options={['New', 'Change']}
                value={formData.requestType} 
                onChange={(v: any) => setFormData({...formData, requestType: v})} 
                theme={theme}
              />
              <InputGroup 
                label="Full Business Name" 
                placeholder="Name in Full"
                value={formData.name} 
                onChange={(v: string) => setFormData({...formData, name: v})} 
                theme={theme}
              />
              <InputGroup 
                label="Floor/Building No" 
                value={formData.address?.floorBuilding} 
                onChange={(v: string) => updateNested('address', 'floorBuilding', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Street" 
                value={formData.address?.street} 
                onChange={(v: string) => updateNested('address', 'street', v)} 
                theme={theme}
              />
              <InputGroup 
                label="City" 
                value={formData.address?.city} 
                onChange={(v: string) => updateNested('address', 'city', v)} 
                theme={theme}
              />
              <InputGroup 
                label="District" 
                value={formData.address?.district} 
                onChange={(v: string) => updateNested('address', 'district', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Pin Code" 
                value={formData.address?.pinCode} 
                onChange={(v: string) => updateNested('address', 'pinCode', v)} 
                theme={theme}
              />
              <InputGroup 
                label="State" 
                value={formData.address?.state} 
                onChange={(v: string) => updateNested('address', 'state', v)} 
                theme={theme}
              />
               <InputGroup label="Phone No" value={formData.address?.phone} onChange={(v: string) => updateNested('address', 'phone', v)} theme={theme} />
               <InputGroup label="Fax" value={formData.address?.fax} onChange={(v: string) => updateNested('address', 'fax', v)} theme={theme} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup 
                label="Contact Person Name" 
                value={formData.contact?.name} 
                onChange={(v: string) => updateNested('contact', 'name', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Designation" 
                value={formData.contact?.designation} 
                onChange={(v: string) => updateNested('contact', 'designation', v)} 
                theme={theme}
              />
              <InputGroup label="Contact Phone" value={formData.contact?.phone} onChange={(v: string) => updateNested('contact', 'phone', v)} theme={theme} />
              <InputGroup label="Contact Fax" value={formData.contact?.fax} onChange={(v: string) => updateNested('contact', 'fax', v)} theme={theme} />
              <InputGroup label="Contact Email" value={formData.contact?.email} onChange={(v: string) => updateNested('contact', 'email', v)} theme={theme} />
              <InputGroup 
                label="Vendor Type" 
                type="select"
                options={['Goods', 'Services']}
                value={formData.statutory?.vendorType} 
                onChange={(v: any) => updateNested('statutory', 'vendorType', v)} 
                theme={theme}
              />
               <InputGroup label="Year of Establishment" value={formData.statutory?.yearOfEstablishment} onChange={(v: string) => updateNested('statutory', 'yearOfEstablishment', v)} theme={theme} />
              <InputGroup 
                label="Constitution" 
                type="select"
                options={['Proprietary', 'Private Limited', 'LLP', 'Partnership', 'Public Limited', 'Trust']}
                value={formData.statutory?.constitution} 
                onChange={(v: any) => updateNested('statutory', 'constitution', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Mobile No" 
                value={formData.address?.mobile} 
                onChange={(v: string) => updateNested('address', 'mobile', v)} 
                theme={theme}
              />
              <InputGroup 
                label="E-Mail ID" 
                value={formData.address?.email} 
                onChange={(v: string) => updateNested('address', 'email', v)} 
                theme={theme}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup label="PAN (Mandatory)" value={formData.statutory?.pan} onChange={(v: string) => updateNested('statutory', 'pan', v)} theme={theme} />
              <InputGroup label="GSTIN (Mandatory)" value={formData.statutory?.gstin} onChange={(v: string) => updateNested('statutory', 'gstin', v)} theme={theme} />
              <InputGroup label="CIN No" value={formData.statutory?.cin} onChange={(v: string) => updateNested('statutory', 'cin', v)} theme={theme} />
              <InputGroup label="MSMED Reg No" value={formData.statutory?.msmedRegNo} onChange={(v: string) => updateNested('statutory', 'msmedRegNo', v)} theme={theme} />
              <InputGroup label="Compounding Dealer" type="select" options={['NO', 'YES']} value={formData.statutory?.compoundingDealer} onChange={(v: any) => updateNested('statutory', 'compoundingDealer', v)} theme={theme} />
              <InputGroup label="Trade License" value={formData.statutory?.tradeLicense} onChange={(v: string) => updateNested('statutory', 'tradeLicense', v)} theme={theme} />
              <InputGroup label="IEC Code" value={formData.statutory?.iecNo} onChange={(v: string) => updateNested('statutory', 'iecNo', v)} theme={theme} />
              <InputGroup label="PF Reg No" value={formData.statutory?.pfRegNo} onChange={(v: string) => updateNested('statutory', 'pfRegNo', v)} theme={theme} />
              <InputGroup label="ESIC Reg No" value={formData.statutory?.esicRegNo} onChange={(v: string) => updateNested('statutory', 'esicRegNo', v)} theme={theme} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup label="Beneficiary Name" value={formData.bank?.beneficiaryName} onChange={(v: string) => updateNested('bank', 'beneficiaryName', v)} theme={theme} />
              <InputGroup label="Bank Name" value={formData.bank?.bankName} onChange={(v: string) => updateNested('bank', 'bankName', v)} theme={theme} />
              <InputGroup label="Account Number" value={formData.bank?.accountNumber} onChange={(v: string) => updateNested('bank', 'accountNumber', v)} theme={theme} />
              <InputGroup label="IFSC Code" value={formData.bank?.ifscCode} onChange={(v: string) => updateNested('bank', 'ifscCode', v)} theme={theme} />
              <InputGroup label="Branch Name" value={formData.bank?.branchName} onChange={(v: string) => updateNested('bank', 'branchName', v)} theme={theme} />
              <InputGroup label="Address of Branch" value={formData.bank?.branchAddress} onChange={(v: string) => updateNested('bank', 'branchAddress', v)} theme={theme} />
              <InputGroup label="Account Type" type="select" options={['Savings', 'Current', 'CC/OD']} value={formData.bank?.accountType} onChange={(v: any) => updateNested('bank', 'accountType', v)} theme={theme} />
              <InputGroup label="Currency" type="select" options={['INR', 'USD', 'EUR', 'GBP']} value={formData.currency} onChange={(v: string) => setFormData({...formData, currency: v})} theme={theme} />
              <InputGroup label="Bank Email" value={formData.bank?.bankEmail} onChange={(v: string) => updateNested('bank', 'bankEmail', v)} theme={theme} />
              <InputGroup label="SWIFT/IBAN" value={formData.bank?.swiftIban} onChange={(v: string) => updateNested('bank', 'swiftIban', v)} theme={theme} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <InputGroup label="Credit Terms" value={formData.creditTerms} onChange={(v: string) => setFormData({...formData, creditTerms: v})} theme={theme} />
              <InputGroup 
                label="TDS Exemption Cert Details" 
                value={formData.statutory?.tdsExemptionDetails} 
                onChange={(v: string) => updateNested('statutory', 'tdsExemptionDetails', v)} 
                theme={theme}
              />
              <InputGroup 
                label="P.C.B Consent to Operate" 
                value={formData.statutory?.consentToOperate} 
                onChange={(v: string) => updateNested('statutory', 'consentToOperate', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Labour License No" 
                value={formData.statutory?.labourLicenseNo} 
                onChange={(v: string) => updateNested('statutory', 'labourLicenseNo', v)} 
                theme={theme}
              />
              <InputGroup 
                label="Factory License" 
                value={formData.statutory?.factoryLicense} 
                onChange={(v: string) => updateNested('statutory', 'factoryLicense', v)} 
                theme={theme}
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <FileField label="GSTIN Copy" required uploaded={!!formData.documents?.gstinCopy} onChange={(e) => handleFileUpload(e, 'gstinCopy')} theme={theme} />
              <FileField label="PAN Copy" required uploaded={!!formData.documents?.panCopy} onChange={(e) => handleFileUpload(e, 'panCopy')} theme={theme} />
              <FileField label="MSMED Copy" required uploaded={!!formData.documents?.msmedCopy} onChange={(e) => handleFileUpload(e, 'msmedCopy')} theme={theme} />
              <FileField label="Cancelled Cheque" required uploaded={!!formData.documents?.cancelledChequeCopy} onChange={(e) => handleFileUpload(e, 'cancelledChequeCopy')} theme={theme} />
              <FileField label="TDS Exemption Cert" uploaded={!!formData.documents?.tdsExemptionCopy} onChange={(e) => handleFileUpload(e, 'tdsExemptionCopy')} theme={theme} />
              <FileField label="Signed Declaration" required uploaded={!!formData.documents?.signedDeclaration} onChange={(e) => handleFileUpload(e, 'signedDeclaration')} theme={theme} />
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <p className="text-xs text-slate-500 text-center font-medium">By registering, you confirm that all provided information is accurate and matches the uploaded documents.</p>
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
            onClick={() => step < totalSteps ? setStep(s => s + 1) : handleSubmit()} 
            className={cn(
              "px-12 py-4 rounded-[1.5rem] text-white font-black flex items-center gap-3 uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95", 
              `bg-gradient-to-r from-${primary} to-${accent}`,
              isSubmitting && "opacity-50"
            )}
          >
            {isSubmitting ? "Processing..." : (step === totalSteps ? "Register" : "Continue")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FileField({ label, required, uploaded, onChange, theme }: any) {
  const { primary } = THEME_COLORS[theme as Theme];
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className={cn(
        "relative flex items-center justify-between p-4 rounded-2xl border transition-all overflow-hidden",
        uploaded ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 hover:border-slate-200"
      )}>
        <span className="text-sm font-bold text-slate-600 truncate mr-10">
          {uploaded ? "File Ready" : "Select Document"}
        </span>
        <div className={cn("p-2 rounded-xl", uploaded ? "bg-emerald-500 text-white" : `bg-${primary} text-white`)}>
           {uploaded ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
        <input 
          type="file" 
          onChange={onChange} 
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
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
