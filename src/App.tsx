import { useState, useEffect, useCallback, useMemo } from 'react';
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
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  TrendingUp,
  Briefcase,
  Globe,
  Bell,
  User,
  CircleDollarSign,
  Calendar,
  ThumbsUp,
  Upload,
  Check,
  Paperclip,
  Box,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from './lib/utils';
import type { Vendor } from './types/vendor';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import Chart from 'react-apexcharts';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  useNavigate 
} from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
} from '@mui/material';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch, loadVendors as fetchVendorsThunk, setHealth } from './store';

import { DUMMY_VENDORS } from './dummyData';

const SCRIPT_URL = (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL;

// Helper for API calls with dummy data fallback
const apiCall = async (action: string, data: any = {}) => {
  try {
    const isDirect = window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost');
    
    if (isDirect && SCRIPT_URL) {
      if (action === 'health' || action === 'list') {
        const resp = await axios.get(`${SCRIPT_URL}?action=${action}`);
        return resp.data;
      }
      const response = await axios.post(SCRIPT_URL, {
        action, ...data
      });
      return response.data;
    }
    
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
  } catch (error) {
    if (action === 'list') return DUMMY_VENDORS;
    if (action === 'health') return { status: 'demo', db: 'demo' };
    throw error;
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

// Material Design Theme Configuration
const themeConfig = createTheme({
  palette: {
    primary: {
      main: '#4F46E5',
    },
    background: {
      default: '#F8F9FD',
    },
  },
  typography: {
    fontFamily: '"Inter", "sans-serif"',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 900 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 16,
  },
});

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: vendors, loading, systemHealth } = useSelector((state: RootState) => state.vendors);

  const refreshData = useCallback(() => {
    dispatch(fetchVendorsThunk());
  }, [dispatch]);

  const checkHealth = useCallback(async () => {
    try {
      const data = await apiCall('health');
      dispatch(setHealth(data));
    } catch (error) {
      dispatch(setHealth({ status: 'demo', db: 'demo' }));
    }
  }, [dispatch]);

  useEffect(() => {
    refreshData();
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [refreshData, checkHealth]);

  return (
    <ThemeProvider theme={themeConfig}>
      <CssBaseline />
      <Router>
        <Layout systemHealth={systemHealth}>
          <Routes>
            <Route path="/" element={<Dashboard vendors={vendors} health={systemHealth} onRefresh={refreshData} />} />
            <Route path="/vendors" element={<VendorList vendors={vendors} loading={loading} />} />
            <Route path="/register" element={<RegistrationForm onComplete={refreshData} />} />
            <Route path="/settings" element={<SettingsView health={systemHealth} />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

function Layout({ children, systemHealth }: { children: React.ReactNode, systemHealth: any }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vendors', label: 'Vendor Registry', icon: Users },
    { path: '/register', label: 'New Onboarding', icon: Plus },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans">
      {/* Top Header */}
      <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-8 md:px-16 sticky top-0 z-40 shadow-sm">
         <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl group-hover:scale-105 transition-transform">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
                  Yajur<span className="text-indigo-600">Portal</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Vendor Onboarding</span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-6 py-2.5 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2.5",
                    location.pathname === item.path 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                      : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
         </div>

         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 mr-8">
               <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className={cn("h-2.5 w-2.5 rounded-full", systemHealth.db !== 'disconnected' ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500")} />
                 <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{systemHealth.db !== 'disconnected' ? 'Cloud Sync Active' : 'Offline'}</span>
               </div>
               <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all relative">
                 <Bell className="h-5 w-5" />
                 <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white" />
               </button>
            </div>
            
            <div className="h-10 w-px bg-slate-100 hidden sm:block" />
            
            <div className="flex items-center gap-4 cursor-pointer group pl-2">
              <div className="text-right hidden sm:block">
                 <p className="text-[13px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">Prosun Majhi</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">Global Admin</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 border-2 border-white shadow-md overflow-hidden flex items-center justify-center transition-all group-hover:shadow-lg">
                <User className="h-7 w-7 text-indigo-400" />
              </div>
            </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-6 md:p-14">
         {children}
      </main>

      {/* Mobile Nav */}
      <div className="xl:hidden fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2.5rem] px-5 py-4 flex items-center gap-4 z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-4 rounded-2xl transition-all",
              location.pathname === item.path ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ vendors = [] }: any) {
  const navigate = useNavigate();
  const vendorsArray = Array.isArray(vendors) ? vendors : [];

  const stats = [
    { label: 'Total Active Vendors', value: vendorsArray.length.toString(), icon: Users, color: 'indigo', description: 'Verified registry' },
    { label: 'Goods Suppliers', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Goods').length.toString(), icon: Box, color: 'emerald', description: 'Material partners' },
    { label: 'Service Providers', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Services').length.toString(), icon: Activity, color: 'amber', description: 'Service contracts' },
    { label: 'New Requests', value: vendorsArray.filter(v => v.requestType === 'New').length.toString(), icon: Plus, color: 'rose', description: 'Pending review' },
    { label: 'Address Changes', value: vendorsArray.filter(v => v.requestType === 'Change').length.toString(), icon: RefreshCw, color: 'blue', description: 'Details update' },
    { label: 'Recent Onboarding', value: vendorsArray.filter(v => new Date(v.createdAt).getTime() > Date.now() - 86400000 * 7).length.toString(), icon: Clock, color: 'purple', description: 'Last 7 days' },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-3 ml-1">Platform Overview</h2>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Vendor Command <span className="text-slate-300">Center</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/vendors')}
            className="px-8 py-5 bg-white text-slate-600 rounded-[2rem] text-[13px] font-black uppercase tracking-widest hover:bg-slate-50 border border-slate-100 shadow-xl shadow-slate-100/50 transition-all"
          >
            Manage Registry
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] text-[13px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex items-center gap-4"
          >
            <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            Initiate Onboarding
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className={cn(
              "h-12 w-12 mb-6 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-md",
              stat.color === 'indigo' ? "bg-indigo-600 text-white" :
              stat.color === 'emerald' ? "bg-emerald-500 text-white" :
              stat.color === 'amber' ? "bg-amber-400 text-white" : 
              stat.color === 'rose' ? "bg-rose-500 text-white" :
              stat.color === 'blue' ? "bg-blue-500 text-white" : "bg-purple-500 text-white"
            )}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-2">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Activity</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Vendor registration distribution by category</p>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <span className="h-3 w-3 rounded-full bg-indigo-600" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Goods</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="h-3 w-3 rounded-full bg-slate-200" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Services</span>
               </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full bg-slate-50/30 rounded-[2.5rem] flex items-end justify-center gap-8 p-10 pb-16 relative overflow-hidden">
             {[
               { h: 45, s: 20 }, { h: 60, s: 35 }, { h: 35, s: 15 }, 
               { h: 80, s: 45 }, { h: 55, s: 25 }, { h: 95, s: 60 }
             ].map((val, i) => (
               <div key={i} className="flex flex-col items-center justify-end h-full gap-2 relative">
                 <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${val.h}%` }}
                   className="w-16 bg-indigo-600 rounded-t-2xl shadow-xl shadow-indigo-100"
                 />
                 <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${val.s}%` }}
                   className="w-16 bg-slate-200 rounded-t-xl absolute bottom-0 z-10"
                 />
                 <span className="text-[9px] font-black text-slate-400 uppercase absolute -bottom-8">Batch {i+1}</span>
               </div>
             ))}
             <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none p-10 flex flex-col justify-between">
                <div className="h-px w-full bg-slate-100" />
                <div className="h-px w-full bg-slate-100" />
                <div className="h-px w-full bg-slate-100" />
                <div className="h-px w-full bg-slate-100" />
             </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-10 text-white relative overflow-hidden group">
           <div className="relative z-10 h-full flex flex-col">
              <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                 <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-4 leading-tight">Master Compliance Assurance</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                All vendors undergo rigorous validation. Data is synchronized with Google Drive and Sheets in real-time.
              </p>
              
              <div className="mt-auto space-y-4">
                 <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">Statutory Check</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Real-time GSTN Validation</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-5 bg-white/5 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">Identity Audit</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">256-bit Document Encryption</p>
                    </div>
                 </div>
              </div>
           </div>
           <Building2 className="absolute -right-20 -bottom-20 h-80 w-80 text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    amber: "bg-amber-400 shadow-amber-100",
    rose: "bg-rose-500 shadow-rose-100",
    emerald: "bg-emerald-500 shadow-emerald-100",
    indigo: "bg-[#4069FF] shadow-indigo-100"
  };

  const labels: any = {
    amber: "bg-amber-500",
    rose: "bg-rose-600",
    emerald: "bg-emerald-600",
    indigo: "bg-[#2C5EFF]"
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-black text-slate-900 leading-tight">{value}</h4>
          <p className="text-xs font-bold text-slate-400 mt-1">{title}</p>
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-md", colors[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={cn("px-6 py-2.5 flex items-center justify-between text-white text-[10px] font-bold uppercase tracking-widest", labels[color])}>
        <span>{trend}</span>
        <TrendingUp className="h-3 w-3" />
      </div>
    </div>
  );
}

function TrafficItem({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${value}%` }} 
          className={cn("h-full rounded-full", color)} 
        />
      </div>
    </div>
  );
}

function VendorList({ vendors = [], loading }: { vendors: Vendor[], loading: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const vendorsArray = Array.isArray(vendors) ? vendors : [];

  const filteredVendors = vendorsArray.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.statutory.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
        <div className="flex-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-3 ml-1">Registry Management</h2>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Vendor <span className="text-slate-300">Database</span></h1>
          
          <div className="relative mt-8 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by legal name, GSTIN, PAN or System ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-3xl py-5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2.5 px-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
             <Download className="h-4 w-4" /> Export CSV
           </button>
           <Link to="/register" className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 active:scale-95 transition-all">
             <Plus className="h-4 w-4" /> Register New
           </Link>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
        {filteredVendors.map((vendor, idx) => (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <VendorCard vendor={vendor} onSelect={() => setSelectedVendor(vendor)} />
          </motion.div>
        ))}
        {loading && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center gap-4">
             <div className="h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Master Data...</p>
          </div>
        )}
        {!loading && filteredVendors.length === 0 && (
          <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border border-slate-100 border-dashed">
            <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
               <Users className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">No Match Found</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Try a different search query or filter</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedVendor && <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function VendorCard({ vendor, onSelect }: { vendor: Vendor, onSelect: () => void }) {
  return (
    <div className="group bg-white rounded-[3rem] border border-slate-100 p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/50 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
      
      <div className="flex items-start justify-between relative z-10 mb-8">
        <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
          {vendor.name.charAt(0)}
        </div>
        <div className="text-right">
           <span className={cn(
             "px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em]",
             vendor.statutory.vendorType === 'Goods' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
           )}>
             {vendor.statutory.vendorType}
           </span>
           <p className="text-[10px] font-black text-slate-300 mt-4 uppercase tracking-[0.2em]">{vendor.id}</p>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-2xl font-black text-slate-900 truncate tracking-tighter group-hover:text-indigo-600 transition-colors uppercase leading-tight">{vendor.name}</h3>
        <div className="flex items-center gap-2 mt-2">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{vendor.address.city}, {vendor.address.state}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-10 p-6 bg-slate-50/50 rounded-3xl relative z-10 border border-slate-50">
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-50">Tax ID (PAN)</p>
            <p className="text-sm font-black text-slate-700 tracking-tight uppercase">{vendor.statutory.pan}</p>
         </div>
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-50">Business Model</p>
            <p className="text-sm font-black text-slate-700 tracking-tight uppercase">{vendor.statutory.constitution}</p>
         </div>
      </div>

      <button onClick={onSelect} className="mt-10 w-full py-5 bg-white border border-slate-100 text-slate-500 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-95 relative z-10">
        Review Master Profile
      </button>
    </div>
  );
}

function VendorDetailModal({ vendor, onClose }: { vendor: Vendor, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] w-full max-w-6xl shadow-2xl overflow-hidden relative my-8">
        <div className="sticky top-0 bg-white z-10 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Building2 className="h-7 w-7" /></div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{vendor.name}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System ID: {vendor.id} • Registered {formatDate(vendor.createdAt)}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2">
                 <Download className="h-4 w-4" /> Export Profile
               </button>
               <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><X className="h-6 w-6" /></button>
            </div>
        </div>

        <div className="p-10 grid gap-8 lg:grid-cols-4 max-h-[75vh] overflow-y-auto bg-[#F8F9FD]">
           <div className="lg:col-span-1 space-y-8">
              <ProfileSection title="Address Details" icon={MapPin}>
                 <ProfileItem label="Full Address" value={`${vendor.address.floorBuilding}, ${vendor.address.street}`} />
                 <ProfileItem label="Location" value={`${vendor.address.city}, ${vendor.address.district}`} />
                 <ProfileItem label="Region" value={`${vendor.address.state}, ${vendor.address.country}`} />
                 <ProfileItem label="Pin Code" value={vendor.address.pinCode} />
                 <ProfileItem label="Mobile" value={vendor.address.mobile} highlighted />
                 <ProfileItem label="Email" value={vendor.address.email} />
              </ProfileSection>

              <ProfileSection title="Currency & Credit" icon={CircleDollarSign}>
                 <ProfileItem label="Currency" value={vendor.currency} highlighted />
                 <ProfileItem label="Credit Terms" value={vendor.creditTerms} />
              </ProfileSection>
           </div>

           <div className="lg:col-span-1 space-y-8">
              <ProfileSection title="Contact Person" icon={User}>
                 <ProfileItem label="Name" value={vendor.contact.name} />
                 <ProfileItem label="Designation" value={vendor.contact.designation} />
                 <ProfileItem label="Phone" value={vendor.contact.phone} highlighted />
                 <ProfileItem label="Email" value={vendor.contact.email} />
              </ProfileSection>

              <ProfileSection title="Classification" icon={Briefcase}>
                 <ProfileItem label="Vendor Type" value={vendor.statutory.vendorType} highlighted />
                 <ProfileItem label="Established" value={vendor.statutory.yearOfEstablishment} />
                 <ProfileItem label="Constitution" value={vendor.statutory.constitution} />
              </ProfileSection>
           </div>

           <div className="lg:col-span-1 space-y-8">
              <ProfileSection title="Statutory Details" icon={ShieldCheck}>
                 <ProfileItem label="PAN" value={vendor.statutory.pan} highlighted />
                 <ProfileItem label="GSTIN" value={vendor.statutory.gstin} highlighted />
                 <ProfileItem label="CIN" value={vendor.statutory.cin} />
                 <ProfileItem label="MSMED No" value={vendor.statutory.msmedRegNo} />
                 <ProfileItem label="IEC Code" value={vendor.statutory.iecNo} />
              </ProfileSection>

              <ProfileSection title="Bank Details" icon={CreditCard}>
                 <ProfileItem label="Bank Name" value={vendor.bank.bankName} />
                 <ProfileItem label="Account No" value={vendor.bank.accountNumber} highlighted />
                 <ProfileItem label="IFSC Code" value={vendor.bank.ifscCode} />
                 <ProfileItem label="Branch" value={vendor.bank.branchName} />
              </ProfileSection>
           </div>

           <div className="lg:col-span-1 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-4">
                <Paperclip className="h-4 w-4" /> Attachments
              </h3>
              <div className="space-y-3">
                 <DocLink label="GSTIN Certificate" url={vendor.documents.gstinCopy} />
                 <DocLink label="PAN Card Copy" url={vendor.documents.panCopy} />
                 <DocLink label="MSMED Registration" url={vendor.documents.msmedCopy} />
                 <DocLink label="Cancelled Cheque" url={vendor.documents.cancelledChequeCopy} />
                 <DocLink label="TDS Certificate" url={vendor.documents.tdsExemptionCopy} />
                 <DocLink label="Signed Declaration" url={vendor.documents.signedDeclaration} />
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function DocLink({ label, url }: { label: string, url?: string }) {
  if (!url || url === '' || url === '#') return null;
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all group"
    >
       <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{label}</span>
       </div>
       <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-indigo-400" />
    </a>
  );
}

function ProfileSection({ title, icon: Icon, children, className }: any) {
  return (
    <div className={cn("bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm", className)}>
       <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
          <Icon className="h-5 w-5 text-indigo-600" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h4>
       </div>
       <div className="space-y-4">
          {children}
       </div>
    </div>
  );
}

function ProfileItem({ label, value, highlighted }: any) {
  return (
    <div>
       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
       <p className={cn("text-sm font-bold", highlighted ? "text-indigo-600 font-black" : "text-slate-700")}>{value || 'N/A'}</p>
    </div>
  );
}


const REGISTRATION_SCHEMA = Yup.object().shape({
  name: Yup.string().required('Legal name is required'),
  requestType: Yup.string().oneOf(['New', 'Change']).required(),
  address: Yup.object().shape({
    floorBuilding: Yup.string().required('Required'),
    street: Yup.string().required('Required'),
    city: Yup.string().required('Required'),
    district: Yup.string().required('Required'),
    pinCode: Yup.string().required('Required'),
    state: Yup.string().required('Required'),
    country: Yup.string().required('Required'),
    mobile: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
  }),
  contact: Yup.object().shape({
    name: Yup.string().required('Required'),
    designation: Yup.string().required('Required'),
    phone: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
  }),
  statutory: Yup.object().shape({
    vendorType: Yup.string().oneOf(['Goods', 'Services']).required(),
    yearOfEstablishment: Yup.string().required('Required'),
    constitution: Yup.string().required('Required'),
    pan: Yup.string().required('Required'),
    gstin: Yup.string().required('Required'),
    compoundingDealer: Yup.string().oneOf(['YES', 'NO']).required(),
  }),
  bank: Yup.object().shape({
    beneficiaryName: Yup.string().required('Required'),
    bankName: Yup.string().required('Required'),
    accountNumber: Yup.string().required('Required'),
    branchName: Yup.string().required('Required'),
    branchAddress: Yup.string().required('Required'),
    accountType: Yup.string().required('Required'),
    ifscCode: Yup.string().required('Required'),
    bankEmail: Yup.string().email('Invalid email'),
  }),
  currency: Yup.string().required('Required'),
  creditTerms: Yup.string().required('Required'),
});

function RegistrationForm({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-20">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Onboarding Request</h1>
        <p className="text-slate-500 font-medium text-sm mt-2 uppercase tracking-widest">Complete the vendor master information form</p>
      </div>

      <div className="bg-white rounded-[3rem] p-8 md:p-16 border border-slate-100 shadow-2xl">
        <Formik
          initialValues={{
            requestType: 'New',
            name: '',
            address: { 
              floorBuilding: '', street: '', city: '', district: '', pinCode: '', state: '', country: 'India', 
              phone: '', fax: '', mobile: '', email: '' 
            },
            contact: { name: '', designation: '', phone: '', fax: '', email: '' },
            statutory: { 
              vendorType: 'Goods' as any, yearOfEstablishment: '', constitution: 'Private Limited' as any, 
              cin: '', tradeLicense: '', pan: '', gstin: '', lutNo: '', compoundingDealer: 'NO' as any, 
              msmedRegNo: '', iecNo: '', pfRegNo: '', esicRegNo: '', labourLicenseNo: '', factoryLicense: '',
              tdsExemptionDetails: '', consentToOperate: ''
            },
            bank: { 
              beneficiaryName: '', bankName: '', accountNumber: '', branchName: '', branchAddress: '', 
              accountType: 'Current' as any, ifscCode: '', swiftIban: '', bankEmail: '' 
            },
            currency: 'INR',
            creditTerms: 'NET 30',
            documents: {
              gstinCopy: '',
              panCopy: '',
              msmedCopy: '',
              cancelledChequeCopy: '',
              tdsExemptionCopy: '',
              signedDeclaration: ''
            }
          }}
          validationSchema={REGISTRATION_SCHEMA}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await apiCall('add', { vendor: { ...values, id: `V${Date.now()}`, createdAt: new Date().toISOString() } });
              onComplete();
              navigate('/vendors');
            } catch (error) {
              console.error(error);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form className="space-y-16">
              {/* A. General Information */}
              <FormSection title="A. General Information" icon={Settings}>
                <div className="grid gap-6 sm:grid-cols-2">
                   <FormInput label="Request Type" name="requestType" type="select" options={['New', 'Change']} />
                </div>
              </FormSection>

              {/* B. Address Details */}
              <FormSection title="B. Address Details" icon={MapPin}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   <FormInput label="Name in Full" name="name" placeholder="Legal Name" error={touched.name && errors.name} />
                   <FormInput label="Floor/Building No" name="address.floorBuilding" placeholder="Unit, Building name" error={touched.address?.floorBuilding && (errors as any).address?.floorBuilding} />
                   <FormInput label="Street" name="address.street" placeholder="Main road, area" error={touched.address?.street && (errors as any).address?.street} />
                   <FormInput label="City" name="address.city" placeholder="City" error={touched.address?.city && (errors as any).address?.city} />
                   <FormInput label="District" name="address.district" placeholder="District" error={touched.address?.district && (errors as any).address?.district} />
                   <FormInput label="Pin Code" name="address.pinCode" placeholder="6 digits" error={touched.address?.pinCode && (errors as any).address?.pinCode} />
                   <FormInput label="State" name="address.state" placeholder="State" error={touched.address?.state && (errors as any).address?.state} />
                   <FormInput label="Country" name="address.country" placeholder="Country" error={touched.address?.country && (errors as any).address?.country} />
                   <FormInput label="Phone No" name="address.phone" placeholder="Landline" />
                   <FormInput label="Fax" name="address.fax" placeholder="Fax number" />
                   <FormInput label="Mobile No" name="address.mobile" placeholder="Contact mobile" error={touched.address?.mobile && (errors as any).address?.mobile} />
                   <FormInput label="E-Mail ID" name="address.email" placeholder="Business email" error={touched.address?.email && (errors as any).address?.email} />
                </div>
              </FormSection>

              {/* C. Contact Details */}
              <FormSection title="C. Contact Details" icon={User}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   <FormInput label="Contact Person" name="contact.name" placeholder="Full name" error={touched.contact?.name && (errors as any).contact?.name} />
                   <FormInput label="Designation" name="contact.designation" placeholder="Job title" error={touched.contact?.designation && (errors as any).contact?.designation} />
                   <FormInput label="Phone" name="contact.phone" placeholder="Direct line" error={touched.contact?.phone && (errors as any).contact?.phone} />
                   <FormInput label="Fax" name="contact.fax" placeholder="Direct fax" />
                   <FormInput label="E-Mail" name="contact.email" placeholder="Personal business email" error={touched.contact?.email && (errors as any).contact?.email} />
                </div>
              </FormSection>

              {/* D. Vendor Classification & Constitution */}
              <FormSection title="D. Vendor Classification & Constitution" icon={Briefcase}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   <FormInput label="Vendor Type" name="statutory.vendorType" type="select" options={['Goods', 'Services']} />
                   <FormInput label="Year of Establishment" name="statutory.yearOfEstablishment" placeholder="YYYY" error={touched.statutory?.yearOfEstablishment && (errors as any).statutory?.yearOfEstablishment} />
                   <FormInput label="Constitution" name="statutory.constitution" type="select" options={['Proprietary', 'Private Limited', 'LLP', 'Partnership', 'Public Limited', 'Trust']} />
                </div>
              </FormSection>

              {/* E. Statutory Details */}
              <FormSection title="E. Statutory Details" icon={ShieldCheck}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   <FormInput label="CIN" name="statutory.cin" placeholder="Corporate ID No" />
                   <FormInput label="Trade License" name="statutory.tradeLicense" placeholder="License no" />
                   <FormInput label="PAN" name="statutory.pan" placeholder="10 Digit PAN" error={touched.statutory?.pan && (errors as any).statutory?.pan} />
                   <FormInput label="GSTIN" name="statutory.gstin" placeholder="15 Digit GSTIN" error={touched.statutory?.gstin && (errors as any).statutory?.gstin} />
                   <FormInput label="LUT NO" name="statutory.lutNo" placeholder="LUT number" />
                   <FormInput label="Compounding Dealer" name="statutory.compoundingDealer" type="select" options={['YES', 'NO']} />
                   <FormInput label="MSMED Reg No" name="statutory.msmedRegNo" placeholder="MSME registration" />
                   <FormInput label="IEC No" name="statutory.iecNo" placeholder="Import Export Code" />
                   <FormInput label="PF Reg No" name="statutory.pfRegNo" placeholder="Provident Fund" />
                   <FormInput label="ESIC Reg No" name="statutory.esicRegNo" placeholder="ESIC no" />
                   <FormInput label="Labour License" name="statutory.labourLicenseNo" placeholder="Labour license" />
                   <FormInput label="Factory License" name="statutory.factoryLicense" placeholder="Factory license" />
                </div>
              </FormSection>

              {/* F. Additional Compliance */}
              <FormSection title="F. Additional Compliance" icon={Activity}>
                <div className="grid gap-6 sm:grid-cols-2">
                   <FormInput label="TDS Exemption Details" name="statutory.tdsExemptionDetails" placeholder="Certificate details" />
                   <FormInput label="Consent to Operate (PCB)" name="statutory.consentToOperate" placeholder="Pollution Control Board" />
                </div>
              </FormSection>

              {/* G. Bank Details */}
              <FormSection title="G. Bank Details" icon={CreditCard}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   <FormInput label="Beneficiary Name" name="bank.beneficiaryName" placeholder="As per bank record" error={touched.bank?.beneficiaryName && (errors as any).bank?.beneficiaryName} />
                   <FormInput label="Bank Name" name="bank.bankName" placeholder="Full Bank Name" error={touched.bank?.bankName && (errors as any).bank?.bankName} />
                   <FormInput label="Account Number" name="bank.accountNumber" placeholder="Bank Account No" error={touched.bank?.accountNumber && (errors as any).bank?.accountNumber} />
                   <FormInput label="Bank Branch" name="bank.branchName" placeholder="Branch Name" error={touched.bank?.branchName && (errors as any).bank?.branchName} />
                   <FormInput label="Branch Address" name="bank.branchAddress" placeholder="Full office address" error={touched.bank?.branchAddress && (errors as any).bank?.branchAddress} />
                   <FormInput label="Account Type" name="bank.accountType" type="select" options={['Savings', 'Current', 'CC/OD']} />
                   <FormInput label="IFSC Code" name="bank.ifscCode" placeholder="Branch IFSC" error={touched.bank?.ifscCode && (errors as any).bank?.ifscCode} />
                   <FormInput label="SWIFT/IBAN" name="bank.swiftIban" placeholder="Intl transfers" />
                   <FormInput label="Bank Email" name="bank.bankEmail" placeholder="Contact of branch" />
                </div>
              </FormSection>

              {/* H. Currency & Credit Terms */}
              <FormSection title="H. Currency & Credit Terms" icon={CircleDollarSign}>
                <div className="grid gap-6 sm:grid-cols-2">
                   <FormInput label="Transaction Currency" name="currency" type="select" options={['INR', 'USD', 'EUR', 'GBP', 'AED']} />
                   <FormInput label="Credit Terms" name="creditTerms" placeholder="E.g. NET 30" error={touched.creditTerms && errors.creditTerms} />
                </div>
              </FormSection>

              {/* Required Attachment Files */}
              <FormSection title="Required Attachment Files" icon={Paperclip}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   <FileField label="GSTIN Copy" value={values.documents.gstinCopy} onUpload={(url) => setFieldValue('documents.gstinCopy', url)} required />
                   <FileField label="PAN Copy" value={values.documents.panCopy} onUpload={(url) => setFieldValue('documents.panCopy', url)} required />
                   <FileField label="MSMED Copy" value={values.documents.msmedCopy} onUpload={(url) => setFieldValue('documents.msmedCopy', url)} />
                   <FileField label="Cancelled Cheque" value={values.documents.cancelledChequeCopy} onUpload={(url) => setFieldValue('documents.cancelledChequeCopy', url)} required />
                   <FileField label="TDS Exemption" value={values.documents.tdsExemptionCopy} onUpload={(url) => setFieldValue('documents.tdsExemptionCopy', url)} />
                   <FileField label="Signed Declaration" value={values.documents.signedDeclaration} onUpload={(url) => setFieldValue('documents.signedDeclaration', url)} />
                </div>
              </FormSection>

              <div className="pt-10 flex items-center justify-center gap-6 border-t border-slate-50">
                 <button type="button" onClick={() => navigate('/vendors')} className="px-12 py-4 bg-slate-50 text-slate-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="px-16 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl active:scale-95 transition-all flex items-center gap-2">
                   {isSubmitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                   Submit Onboarding
                 </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </motion.div>
  );
}

function FormSection({ title, icon: Icon, children }: any) {
  return (
    <div className="space-y-8 p-8 md:p-10 bg-slate-50/30 rounded-[2.5rem] border border-slate-50/50">
      <div className="flex items-center gap-4 border-b border-white pb-6">
        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-600 font-mono tracking-tighter">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FileField({ label, value, onUpload, required }: any) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Simulate file upload - in real app, we would upload to storage/API
      await new Promise(resolve => setTimeout(resolve, 1500));
      onUpload('https://example.com/uploaded/' + file.name);
    } catch (error) {
      console.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className={cn(
        "relative group h-40 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 overflow-hidden",
        value ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100 hover:border-indigo-400 hover:bg-slate-50"
      )}>
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Uploading...</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center gap-2 text-emerald-600">
            <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Check className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Document Secured</span>
            <span className="text-[8px] font-bold opacity-70 max-w-[150px] truncate">{value.split('/').pop()}</span>
          </div>
        ) : (
          <>
            <div className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Upload className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600">Upload File</span>
          </>
        )}
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          disabled={uploading}
        />
      </div>
    </div>
  );
}

function FormInput({ label, name, type = 'text', placeholder, options, error }: any) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
       {type === 'select' ? (
         <Field as="select" name={name} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all outline-none">
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
         </Field>
       ) : (
         <Field name={name} placeholder={placeholder} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all outline-none" />
       )}
       {error && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest pl-1">{error}</p>}
    </div>
  );
}

function SettingsView({ health }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">System Settings</h1>
        <p className="text-slate-500 font-medium text-sm mt-3">Platform configuration and integration status.</p>
      </div>

      <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl space-y-10">
          <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 pb-2 border-b border-slate-50">Integration Status</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-5 bg-[#F8F9FD] rounded-[1.5rem]">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><Database className="h-5 w-5 text-indigo-600" /></div>
                       <div>
                          <p className="text-xs font-black text-slate-900 uppercase">Google Sheets API</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{health.db === 'demo' ? 'DEMO MODE (Simulation)' : 'PRODUCTION (Connected)'}</p>
                       </div>
                    </div>
                    <div className={cn("h-3 w-3 rounded-full shadow-sm", health.db === 'disconnected' ? "bg-rose-500" : "bg-emerald-500")} />
                 </div>
                 <div className="flex items-center justify-between p-5 bg-[#F8F9FD] rounded-[1.5rem]">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><Globe className="h-5 w-5 text-indigo-600" /></div>
                       <div>
                          <p className="text-xs font-black text-slate-900 uppercase">Email Dispatcher</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">v2.1 SES Gateway</p>
                       </div>
                    </div>
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
                 </div>
              </div>
          </section>

          <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 pb-2 border-b border-slate-50">Experimental Features</h3>
              <div className="flex items-center justify-between p-5 bg-[#F8F9FD] rounded-[1.5rem] opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><Plus className="h-5 w-5 text-slate-400" /></div>
                     <div>
                        <p className="text-xs font-black text-slate-900 uppercase">Dark Mode (Beta)</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Locked: Evaluation needed</p>
                     </div>
                  </div>
                  <Settings className="h-5 w-5 text-slate-400" />
              </div>
          </section>
      </div>
    </motion.div>
  );
}

function HealthItem({ label, status, desc, isOnline }: any) {
  return (
    <div className="flex items-center gap-6 p-5 hover:bg-slate-50 rounded-[2rem] transition-all group border border-transparent hover:border-slate-100">
      <div className={cn("h-12 w-12 min-w-[3rem] rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm", isOnline ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
        {isOnline ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
      </div>
      <div>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{label}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{desc}</p>
      </div>
    </div>
  );
}
