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
  LogOut,
  CheckSquare,
  FolderOpen,
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
  HashRouter as Router, 
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

// axios.defaults.baseURL = window.location.origin;

// Helper for API calls with robust static fallback
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
      try {
        const res = await axios.get('/api/vendors');
        return res.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          console.warn('Backend unavailable, using LocalStorage repository');
          const stored = localStorage.getItem('vendor_registry');
          return stored ? JSON.parse(stored) : DUMMY_VENDORS;
        }
        throw err;
      }
    }
    
    if (action === 'add') {
      try {
        const res = await axios.post('/api/vendors', data);
        return res.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          const stored = localStorage.getItem('vendor_registry');
          const current = stored ? JSON.parse(stored) : DUMMY_VENDORS;
          const updated = [data.vendor, ...current];
          localStorage.setItem('vendor_registry', JSON.stringify(updated));
          return { success: true, mode: 'local_persistence' };
        }
        throw err;
      }
    }
    
    if (action === 'health') {
      try {
        const res = await axios.get('/api/health');
        return res.data;
      } catch (err) {
        return { status: 'static_mode', db: 'local_persistence', message: 'Running without active backend' };
      }
    }
  } catch (error) {
    console.error(`apiCall ${action} error:`, error);
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
      main: '#6366f1', // Indigo 600
    },
    secondary: {
      main: '#0f172a', // Slate 900
    },
    background: {
      default: '#f8fafc', // Slate 50
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.01em' },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 12,
        },
      },
    },
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
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/vendors', label: 'Vendor Registry', icon: Users },
    { path: '/register', label: 'New Onboarding', icon: Plus },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans flex flex-col">
      {/* Top bar with Navigation */}
      <header className="h-24 bg-[#0f172a] text-white flex items-center justify-between px-10 sticky top-0 z-50 shadow-2xl">
         <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 flex transform group-hover:rotate-6 transition-transform">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tight text-white leading-none font-display uppercase">
                  Yajur<span className="text-indigo-400">Portal</span>
                </span>
                <span className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-300 mt-1">Vendor Master v2.1</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all",
                    location.pathname === item.path 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
         </div>

         <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-6 pr-8 border-r border-white/10">
               <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                  <div className={cn("h-3 w-3 rounded-full shadow-lg", systemHealth.db !== 'disconnected' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300">{systemHealth.db !== 'disconnected' ? 'Cloud Live' : 'Offline'}</span>
               </div>
               <button className="relative p-3 text-slate-400 hover:text-white transition-all bg-white/5 rounded-2xl hover:bg-white/10">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-3 right-3 h-3 w-3 bg-rose-500 rounded-full border-2 border-[#0f172a] shadow-sm" />
               </button>
            </div>
            
            <div className="flex items-center gap-6 group">
               <div className="flex items-center gap-4 cursor-pointer p-1.5 pr-4 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center border-2 border-white shadow-xl group-hover:scale-105 transition-transform overflow-hidden">
                     <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&q=80" alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-black text-white leading-none uppercase tracking-tighter">Prosun Majhi</p>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Super Admin</p>
                  </div>
               </div>
               
               <button 
                 onClick={() => {
                   if(confirm('Are you sure you want to logout?')) {
                     window.location.reload();
                   }
                 }}
                 className="flex items-center gap-2 px-5 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-lg border border-rose-600/20 active:scale-95"
               >
                 <LogOut className="h-4 w-4" />
                 <span>Logout</span>
               </button>
            </div>
         </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 p-8 md:p-16 bg-[#f1f5f9]">
         <div className="w-full max-w-[1600px] mx-auto">
           {children}
         </div>
      </main>
    </div>
  );
}

function Dashboard({ vendors = [] }: any) {
  const navigate = useNavigate();
  const vendorsArray = Array.isArray(vendors) ? vendors : [];

  const stats = [
    { label: 'Active Registry', value: vendorsArray.length.toString(), icon: Users, color: 'indigo', description: 'Certified partners', gradient: 'from-indigo-600 to-blue-600' },
    { label: 'Material Supply', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Goods').length.toString(), icon: Box, color: 'emerald', description: 'Goods vendors', gradient: 'from-emerald-600 to-teal-600' },
    { label: 'Key Services', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Services').length.toString(), icon: Activity, color: 'amber', description: 'Service providers', gradient: 'from-amber-500 to-orange-500' },
    { label: 'Pending Review', value: vendorsArray.filter(v => v.requestType === 'New').length.toString(), icon: Clock, color: 'rose', description: 'Action queue', gradient: 'from-rose-600 to-pink-600' },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 font-display flex items-center gap-4 tracking-tight">
             Command Center
             <span className="px-4 py-1.5 bg-indigo-600 text-white text-[12px] font-black uppercase rounded-2xl tracking-[0.2em] shadow-xl shadow-indigo-200">v2.1 Gold</span>
          </h2>
          <p className="text-slate-500 text-lg mt-2 font-medium">Real-time oversight of the vendor ecosystem and procurement health.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/vendors')}
            className="px-8 py-4 bg-white text-slate-800 rounded-2xl text-[15px] font-black uppercase tracking-widest border-2 border-slate-200 shadow-xl shadow-slate-200/50 hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3"
          >
            <Database className="h-5 w-5 text-indigo-600" />
            Registry
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[15px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95"
          >
            <Plus className="h-6 w-6" />
            New Onboarding
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white p-8 rounded-[2.5rem] border border-white shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all cursor-default relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={cn(
                "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:scale-110 shadow-2xl",
                stat.color === 'indigo' ? "bg-indigo-600 text-white" :
                stat.color === 'emerald' ? "bg-emerald-500 text-white" :
                stat.color === 'amber' ? "bg-amber-400 text-white" : 
                "bg-rose-500 text-white"
              )}>
                <stat.icon className="h-8 w-8" />
              </div>
              <TrendingUp className={cn("h-6 w-6 opacity-30", 
                stat.color === 'indigo' ? "text-indigo-600" :
                stat.color === 'emerald' ? "text-emerald-500" :
                stat.color === 'amber' ? "text-amber-500" : 
                "text-rose-500"
              )} />
            </div>
            <div className="relative z-10">
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">{stat.label}</p>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter font-display leading-none">{stat.value}</h3>
              <p className="text-[12px] text-slate-400 mt-4 font-bold uppercase tracking-widest opacity-80">{stat.description}</p>
            </div>
            
            {/* Background Accent */}
            <div className={cn("absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity", 
                stat.color === 'indigo' ? "bg-indigo-600" :
                stat.color === 'emerald' ? "bg-emerald-500" :
                stat.color === 'amber' ? "bg-amber-500" : 
                "bg-rose-500"
            )} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-white shadow-2xl overflow-hidden flex flex-col">
          <div className="px-10 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <div>
              <h3 className="text-3xl font-black text-slate-900 font-display tracking-tight">Performance Analytics</h3>
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mt-2">Vendor distribution and cycle efficiency</p>
            </div>
            <select className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-[12px] font-black uppercase tracking-widest text-slate-600 shadow-sm focus:border-indigo-600 outline-none transition-colors">
               <option>Real-time Feed</option>
               <option>Historical Data</option>
            </select>
          </div>
          
          <div className="flex-1 p-12">
            <div className="h-[400px] w-full flex items-end justify-around gap-8">
              {[85, 45, 95, 35, 65, 100, 55].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-6 h-full justify-end group">
                   <div className="w-full max-w-[60px] relative flex flex-col justify-end h-full">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                        className="bg-gradient-to-t from-indigo-700 to-indigo-400 rounded-t-3xl shadow-2xl group-hover:shadow-indigo-500/50 transition-all cursor-pointer relative"
                      >
                         <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-xl whitespace-nowrap z-20">
                           Batch {i+1}: {h}% Sync
                         </div>
                      </motion.div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h/2.5}%` }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        className="bg-white/40 rounded-t-2xl absolute bottom-0 w-full z-10"
                      />
                   </div>
                   <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Q{i+1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-[3rem] shadow-2xl shadow-indigo-900/20 p-12 text-white flex flex-col relative overflow-hidden group border-r-8 border-indigo-600">
           <div className="relative z-10 flex-1">
              <div className="h-20 w-20 rounded-[2rem] bg-indigo-500 text-white flex items-center justify-center mb-12 shadow-2xl shadow-indigo-500/40 group-hover:rotate-6 transition-transform">
                 <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-4xl font-black font-display mb-6 tracking-tight">Security & Identity</h3>
              <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12">
                Mission-critical validation protocols active. All vendor data encrypted and synchronized with secure master nodes.
              </p>
              
              <div className="space-y-4">
                 {[
                   { label: 'KYC Verification', val: '99.9%', color: 'emerald' },
                   { label: 'Data Encryption', val: 'AES-256', color: 'indigo' },
                   { label: 'Real-time Sync', val: 'Active', color: 'indigo' }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all hover:translate-x-2">
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        <span className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-200">{item.label}</span>
                      </div>
                      <span className="text-[12px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg">{item.val}</span>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="mt-12 relative z-10">
              <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] text-[14px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-4 group">
                 Security Audit
                 <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </button>
           </div>
           
           <Building2 className="absolute -left-20 -bottom-20 h-96 w-96 text-white/5 group-hover:rotate-12 transition-all duration-1000 blur-sm" />
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-white p-12 rounded-[3.5rem] border border-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
        <div className="flex-1">
          <h2 className="text-4xl font-black text-slate-900 font-display tracking-tight">Vendor Registry</h2>
          <p className="text-slate-500 text-lg mt-2 font-medium">Enterprise partner database and statutory archive.</p>
          
          <div className="relative mt-10 max-w-3xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by Legal Name, GSTIN, PAN or System ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-5 pl-16 pr-8 text-[16px] font-bold focus:ring-8 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 transition-all outline-none shadow-inner"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button className="flex items-center gap-3 px-8 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-[14px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-xl hover:shadow-slate-200">
             <Download className="h-5 w-5 text-indigo-600" /> Export CSV
           </button>
           <Link to="/register" className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] text-[14px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all">
             <Plus className="h-5 w-5" /> New Vendor
           </Link>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2 2xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredVendors.map((vendor, idx) => (
            <motion.div
              layout
              key={vendor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
            >
              <VendorCard vendor={vendor} onSelect={() => setSelectedVendor(vendor)} />
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center gap-4">
             <div className="h-10 w-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Master Registry...</p>
          </div>
        )}
        {!loading && filteredVendors.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
               <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-display">No Results</h3>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-tight">Try adjusting your search filters</p>
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
    <div className="group bg-white rounded-[3rem] border border-white p-10 shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-start justify-between mb-10">
        <div className="h-20 w-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-indigo-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          {vendor.name.charAt(0)}
        </div>
        <div className="flex flex-col items-end">
           <span className={cn(
             "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-sm",
             vendor.statutory.vendorType === 'Goods' ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"
           )}>
             {vendor.statutory.vendorType}
           </span>
           <p className="text-[11px] font-black text-slate-300 mt-6 uppercase tracking-[0.3em]">{vendor.id}</p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-3xl font-black text-slate-900 font-display line-clamp-2 group-hover:text-indigo-600 transition-colors uppercase leading-tight tracking-tighter">{vendor.name}</h3>
        <div className="flex items-center gap-3 mt-4 mb-10 text-slate-400">
           <MapPin className="h-5 w-5 text-indigo-400" />
           <p className="text-[14px] font-bold uppercase tracking-widest">{vendor.address.city}, {vendor.address.state}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">Tax ID (PAN)</p>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{vendor.statutory.pan}</p>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">GSTIN / TAX</p>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{vendor.statutory.gstin}</p>
           </div>
        </div>
      </div>

      <button onClick={onSelect} className="mt-10 w-full py-5 bg-white border-2 border-slate-100 text-slate-800 rounded-[2rem] text-[13px] font-black uppercase tracking-widest hover:bg-[#0f172a] hover:text-white hover:border-[#0f172a] transition-all active:scale-95 shadow-xl shadow-slate-100">
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
                 <ProfileItem label="Region" value={`${vendor.address.state}, ${vendor.address.country}, ${vendor.address.pinCode}`} />
                 <ProfileItem label="Contacts" value={`M: ${vendor.address.mobile} | P: ${vendor.address.phone || 'N/A'}`} highlighted />
                 <ProfileItem label="Official Email" value={vendor.address.email} />
                 <ProfileItem label="Fax" value={vendor.address.fax} />
              </ProfileSection>

              <ProfileSection title="Compliance" icon={Activity}>
                 <ProfileItem label="TDS Exemption" value={vendor.statutory.tdsExemptionDetails} highlighted />
                 <ProfileItem label="PCB Consent" value={vendor.statutory.consentToOperate} />
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
                 <ProfileItem label="Constituency" value={vendor.statutory.constitution} />
                 <ProfileItem label="Estd. Year" value={vendor.statutory.yearOfEstablishment} />
              </ProfileSection>

              <ProfileSection title="Trade Terms" icon={CircleDollarSign}>
                 <ProfileItem label="Currency" value={vendor.currency} highlighted />
                 <ProfileItem label="Credit Terms" value={vendor.creditTerms} />
              </ProfileSection>
           </div>

           <div className="lg:col-span-1 space-y-8">
              <ProfileSection title="Statutory Registry" icon={ShieldCheck}>
                 <div className="grid grid-cols-2 gap-4">
                    <ProfileItem label="PAN" value={vendor.statutory.pan} highlighted />
                    <ProfileItem label="GSTIN" value={vendor.statutory.gstin} highlighted />
                 </div>
                 <ProfileItem label="CIN" value={vendor.statutory.cin} />
                 <ProfileItem label="MSMED" value={vendor.statutory.msmedRegNo} />
                 <ProfileItem label="Trade License" value={vendor.statutory.tradeLicense} />
                 <ProfileItem label="IEC Code" value={vendor.statutory.iecNo} />
                 <ProfileItem label="PF No" value={vendor.statutory.pfRegNo} />
                 <ProfileItem label="ESIC No" value={vendor.statutory.esicRegNo} />
                 <ProfileItem label="Labour/Factory" value={`${vendor.statutory.labourLicenseNo || 'N/A'} / ${vendor.statutory.factoryLicense || 'N/A'}`} />
              </ProfileSection>

              <ProfileSection title="Bank Settlement" icon={CreditCard}>
                 <ProfileItem label="Beneficiary" value={vendor.bank.beneficiaryName} />
                 <ProfileItem label="Bank & Branch" value={`${vendor.bank.bankName} (${vendor.bank.branchName})`} />
                 <ProfileItem label="Account" value={`${vendor.bank.accountNumber} [${vendor.bank.accountType}]`} highlighted />
                 <ProfileItem label="IFSC / SWIFT" value={`${vendor.bank.ifscCode} / ${vendor.bank.swiftIban || 'N/A'}`} />
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
    floorBuilding: Yup.string(),
    street: Yup.string(),
    city: Yup.string().required('Required'),
    district: Yup.string(),
    pinCode: Yup.string(),
    state: Yup.string(),
    country: Yup.string(),
    mobile: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    phone: Yup.string(),
    fax: Yup.string(),
  }),
  contact: Yup.object().shape({
    name: Yup.string(),
    designation: Yup.string(),
    phone: Yup.string(),
    fax: Yup.string(),
    email: Yup.string().email('Invalid email'),
  }),
  statutory: Yup.object().shape({
    vendorType: Yup.string().oneOf(['Goods', 'Services']).required(),
    yearOfEstablishment: Yup.string(),
    constitution: Yup.string(),
    pan: Yup.string().required('Required'),
    gstin: Yup.string().required('Required'),
    compoundingDealer: Yup.string().oneOf(['YES', 'NO']),
    cin: Yup.string(),
    tradeLicense: Yup.string(),
    lutNo: Yup.string(),
    msmedRegNo: Yup.string(),
    iecNo: Yup.string(),
    pfRegNo: Yup.string(),
    esicRegNo: Yup.string(),
    labourLicenseNo: Yup.string(),
    factoryLicense: Yup.string(),
    tdsExemptionDetails: Yup.string(),
    consentToOperate: Yup.string(),
  }),
  bank: Yup.object().shape({
    beneficiaryName: Yup.string().required('Required'),
    bankName: Yup.string().required('Required'),
    accountNumber: Yup.string().required('Required'),
    branchName: Yup.string(),
    branchAddress: Yup.string(),
    accountType: Yup.string().required('Required'),
    ifscCode: Yup.string().required('Required'),
    swiftIban: Yup.string(),
    bankEmail: Yup.string().email('Invalid email'),
  }),
  currency: Yup.string().required('Required'),
  creditTerms: Yup.string().required('Required'),
});

function RegistrationForm({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();

  const handleRegister = async (values: any) => {
    try {
      await apiCall('add', { vendor: { ...values, id: `V${Date.now()}`, createdAt: new Date().toISOString() } });
      onComplete();
      navigate('/vendors');
    } catch (error) {
      console.error(error);
      alert('Error finalizing onboarding. Please check your connection.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 bg-white p-12 rounded-[3.5rem] border border-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
        <div>
          <h1 className="text-5xl font-black text-slate-900 font-display tracking-tighter uppercase">Onboarding Terminal</h1>
          <p className="text-slate-500 text-lg mt-3 font-medium uppercase tracking-[0.1em] opacity-60">Vendor Master Registry v2.1 • Secure Entry</p>
        </div>
        <button onClick={() => navigate('/vendors')} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-[2rem] text-[14px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-95 border border-slate-200">
          Exit Terminal
        </button>
      </div>

      <div className="bg-white rounded-[4rem] border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-3 bg-slate-100">
           <motion.div 
             initial={{ width: '0%' }}
             animate={{ width: '100%' }}
             transition={{ duration: 2, ease: "easeInOut" }}
             className="h-full bg-indigo-600" 
           />
        </div>

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
            setSubmitting(true);
            await handleRegister(values);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, errors, touched, setFieldValue, values }) => (
            <Form className="p-10 md:p-20 space-y-32">
              <div className="grid gap-32">
                <FormSection title="A. General Information" icon={Settings}>
                  <div className="grid gap-8 sm:grid-cols-2 max-w-2xl">
                     <FormInput label="Request Type" name="requestType" type="select" options={['New', 'Change']} />
                  </div>
                </FormSection>

                <FormSection title="B. Digital Repository (Attachments)" icon={FolderOpen}>
                  <div className="bg-slate-50 p-10 rounded-[3rem] border-4 border-slate-100 shadow-inner mb-2 transition-all hover:border-indigo-100">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 pb-4 border-b-2 border-slate-200 flex items-center gap-4">
                      <CheckSquare className="h-6 w-6 text-indigo-500" /> Mandatory Attachment Checklist
                    </h4>
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
                       <FileField 
                         label="GSTIN Copy" 
                         value={values.documents.gstinCopy} 
                         onUpload={(url) => setFieldValue('documents.gstinCopy', url)} 
                         required 
                       />
                       <FileField 
                         label="PAN Copy" 
                         value={values.documents.panCopy} 
                         onUpload={(url) => setFieldValue('documents.panCopy', url)} 
                         required 
                       />
                       <FileField 
                         label="MSMED Copy" 
                         value={values.documents.msmedCopy} 
                         onUpload={(url) => setFieldValue('documents.msmedCopy', url)} 
                         required 
                       />
                       <FileField 
                         label="Cancelled Cheque Copy" 
                         value={values.documents.cancelledChequeCopy} 
                         onUpload={(url) => setFieldValue('documents.cancelledChequeCopy', url)} 
                         required 
                       />
                       <FileField 
                         label="TDS Exemption Certificate Copy" 
                         value={values.documents.tdsExemptionCopy} 
                         onUpload={(url) => setFieldValue('documents.tdsExemptionCopy', url)} 
                       />
                       <FileField 
                         label="Signed Declaration Authority" 
                         value={values.documents.signedDeclaration} 
                         onUpload={(url) => setFieldValue('documents.signedDeclaration', url)} 
                       />
                    </div>
                  </div>
                </FormSection>

                <FormSection title="C. Address Details" icon={MapPin}>
                  <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     <FormInput label="Name in Full" name="name" placeholder="Legal Name" error={touched.name && errors.name} />
                     <FormInput label="Floor/Building No" name="address.floorBuilding" placeholder="Unit/Bldg" />
                     <FormInput label="Street" name="address.street" placeholder="Street Name" />
                     <FormInput label="City" name="address.city" placeholder="City" error={touched.address?.city && (errors as any).address?.city} />
                     <FormInput label="District" name="address.district" placeholder="District" />
                     <FormInput label="Pin code" name="address.pinCode" placeholder="6 Digits" />
                     <FormInput label="State" name="address.state" placeholder="State" />
                     <FormInput label="Country" name="address.country" placeholder="Country" />
                     <FormInput label="Phone No" name="address.phone" placeholder="Landline" />
                     <FormInput label="Fax" name="address.fax" placeholder="Fax No" />
                     <FormInput label="Mobile No" name="address.mobile" placeholder="Mobile" />
                     <FormInput label="E-Mail id" name="address.email" placeholder="Official Email" />
                  </div>
                </FormSection>

                <FormSection title="D. Contact Details" icon={Users}>
                  <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                     <FormInput label="Contact Person Name" name="contact.name" placeholder="Full Name" />
                     <FormInput label="Designation" name="contact.designation" placeholder="Job Role" />
                     <FormInput label="Phone" name="contact.phone" placeholder="Contact Phone" />
                     <FormInput label="Fax" name="contact.fax" placeholder="Contact Fax" />
                     <FormInput label="E-Mail id" name="contact.email" placeholder="Contact Email" />
                  </div>
                </FormSection>

                <FormSection title="E. Vendor Classification & Constitution" icon={Briefcase}>
                  <div className="grid gap-x-10 gap-y-12 sm:grid-cols-3 max-w-5xl">
                     <FormInput label="Vendor Type" name="statutory.vendorType" type="select" options={['Goods', 'Services']} />
                     <FormInput label="Year of Establishment" name="statutory.yearOfEstablishment" placeholder="YYYY" />
                     <FormInput label="Constitution" name="statutory.constitution" type="select" options={['Proprietary', 'Private Limited', 'LLP', 'Partnership', 'Public Limited', 'Trust']} />
                  </div>
                </FormSection>

                <FormSection title="F. Statutory Details" icon={ShieldCheck}>
                   <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     <FormInput label="CIN" name="statutory.cin" placeholder="CIN Number" />
                     <FormInput label="Trade License" name="statutory.tradeLicense" placeholder="License Code" />
                     <FormInput label="PAN" name="statutory.pan" placeholder="XXXXX0000X" />
                     <FormInput label="GSTIN" name="statutory.gstin" placeholder="00XXXXX0000X0Z0" />
                     <FormInput label="LUT NO" name="statutory.lutNo" placeholder="LUT Reference" />
                     <FormInput label="Compounding Dealer" name="statutory.compoundingDealer" type="select" options={['YES', 'NO']} />
                     <FormInput label="MSMED Registration No" name="statutory.msmedRegNo" placeholder="UDYAM-XXXX" />
                     <FormInput label="IEC No." name="statutory.iecNo" placeholder="IEC Code" />
                     <FormInput label="PF Registration No." name="statutory.pfRegNo" placeholder="PF Number" />
                     <FormInput label="ESIC Registration No." name="statutory.esicRegNo" placeholder="ESIC Number" />
                     <FormInput label="Labour License Registration No." name="statutory.labourLicenseNo" placeholder="Labour License" />
                     <FormInput label="Factory License" name="statutory.factoryLicense" placeholder="Factory Code" />
                   </div>
                </FormSection>

                <FormSection title="G. Additional Compliance" icon={Activity}>
                   <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                     <FormInput label="Details of TDS Exemption certificate" name="statutory.tdsExemptionDetails" placeholder="Reference details" />
                     <FormInput label="Consent to Operate from P.C.B" name="statutory.consentToOperate" placeholder="Pollution Board Ref" />
                   </div>
                </FormSection>

                <FormSection title="H. Bank Details" icon={CreditCard}>
                   <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                     <FormInput label="Beneficiary name" name="bank.beneficiaryName" placeholder="As per Bank record" />
                     <FormInput label="Name of Bank" name="bank.bankName" placeholder="E.g. HDFC Bank" />
                     <FormInput label="Bank Account Number" name="bank.accountNumber" placeholder="Account No" />
                     <FormInput label="Name of the Bank Branch" name="bank.branchName" placeholder="Branch Name" />
                     <FormInput label="Address of Branch" name="bank.branchAddress" placeholder="Full Address" />
                     <FormInput label="Account type" name="bank.accountType" type="select" options={['Savings', 'Current', 'CC/OD']} />
                     <FormInput label="IFSC Code" name="bank.ifscCode" placeholder="Branch IFSC" />
                     <FormInput label="SWIFT/IBAN number" name="bank.swiftIban" placeholder="International Code" />
                     <FormInput label="Email id of the bank" name="bank.bankEmail" placeholder="bank@service.com" />
                   </div>
                </FormSection>

                <FormSection title="I. Currency & Credit Terms" icon={TrendingUp}>
                   <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 max-w-4xl">
                     <FormInput label="Transaction Currency" name="currency" type="select" options={['INR', 'USD', 'EUR', 'GBP', 'AED']} />
                     <FormInput label="Credit Terms" name="creditTerms" placeholder="E.g. NET 30" />
                   </div>
                </FormSection>
              </div>

              <div className="pt-20 flex items-center justify-end gap-6 border-t-8 border-slate-100">
                 <button 
                   type="button" 
                   onClick={() => navigate('/vendors')} 
                   className="px-12 py-6 bg-white text-slate-400 rounded-[2rem] text-[15px] font-black uppercase tracking-widest border-4 border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-xl"
                 >
                   Discard
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting} 
                   className="px-16 py-6 bg-indigo-600 text-white rounded-[2.5rem] text-[15px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-4 border-4 border-white"
                 >
                   {isSubmitting ? (
                     <>
                       <RefreshCw className="h-6 w-6 animate-spin" />
                       Finalizing Registry...
                     </>
                   ) : (
                     <>
                       <CheckCircle2 className="h-6 w-6" />
                       Finalize Master Record
                     </>
                   )}
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
  const sectionLetter = title.split('.')[0];
  const sectionTitle = title.split('.').slice(1).join('.');

  return (
    <div className="space-y-12 group">
      <div className="flex items-center gap-8 pb-8 border-b-[12px] border-slate-50 group-hover:border-indigo-600 transition-all duration-1000 relative">
        <div className="relative">
          <div className="h-24 w-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 z-10 relative">
            <Icon className="h-12 w-12" />
          </div>
          <div className="absolute -top-6 -left-6 h-16 w-16 rounded-3xl bg-white text-indigo-700 flex items-center justify-center font-black text-2xl shadow-2xl border-4 border-indigo-50 z-20">
            {sectionLetter}
          </div>
        </div>
        <div className="flex flex-col">
          <h3 className="text-3xl font-black uppercase tracking-[0.5em] text-slate-900 font-display leading-none">{sectionTitle}</h3>
          <div className="h-2 w-32 bg-indigo-600 mt-6 rounded-full group-hover:w-64 transition-all duration-1000 shadow-xl shadow-indigo-200" />
        </div>
      </div>
      <div className="pl-4">
        {children}
      </div>
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      onUpload('https://example.com/uploaded/' + file.name);
    } catch (error) {
      console.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none flex items-center justify-between">
        <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        {value ? (
          <span className="text-emerald-500 font-black text-[12px] bg-emerald-50 px-5 py-2 rounded-full border-2 border-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-right-3 shadow-lg shadow-emerald-700/5">
            ✅ REQUIRED / ATTACHED
          </span>
        ) : (
          <span className="text-slate-400 font-black text-[12px] bg-slate-50 px-5 py-2 rounded-full border-2 border-slate-100 flex items-center gap-2 shadow-sm">
            ❌ NOT APPLICABLE / NOT PROVIDED
          </span>
        )}
      </label>
      <div className={cn(
        "relative h-44 rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden shadow-2xl",
        value ? "bg-emerald-50 border-emerald-400 shadow-emerald-500/10" : "bg-slate-50 border-slate-200 hover:border-indigo-600 hover:bg-white hover:shadow-indigo-500/20"
      )}>
        {uploading ? (
          <div className="flex flex-col items-center gap-4 text-indigo-600 animate-pulse">
            <RefreshCw className="h-10 w-10 animate-spin mb-1 shadow-indigo-100" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Synching Node...</span>
          </div>
        ) : value ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4 text-emerald-600">
            <CheckCircle2 className="h-12 w-12 drop-shadow-xl" />
            <span className="text-[12px] font-black uppercase tracking-[0.3em]">Master Authenticated</span>
          </motion.div>
        ) : (
          <>
            <div className="h-14 w-14 rounded-2xl bg-white text-slate-400 flex items-center justify-center shadow-xl border-2 border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
               <Upload className="h-7 w-7" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Target File Path</span>
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
    <div className="space-y-5">
       <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 leading-none block">{label}</label>
       <div className="relative group">
         {type === 'select' ? (
           <Field as="select" name={name} className="w-full bg-white border-4 border-slate-100 rounded-[2.5rem] py-7 px-10 text-[18px] font-black text-slate-900 focus:ring-[20px] focus:ring-indigo-50 focus:border-indigo-600 hover:border-indigo-100 transition-all outline-none shadow-2xl shadow-slate-200/50 appearance-none cursor-pointer">
              {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
           </Field>
         ) : (
           <Field name={name} placeholder={placeholder} className="w-full bg-white border-4 border-slate-100 rounded-[2.5rem] py-7 px-10 text-[18px] font-black text-slate-900 focus:ring-[20px] focus:ring-indigo-50 focus:border-indigo-600 hover:border-indigo-100 transition-all outline-none shadow-2xl shadow-slate-200/50 placeholder:text-slate-200" />
         )}
         <div className="absolute inset-0 rounded-[2.5rem] border-2 border-white/60 pointer-events-none" />
       </div>
       <div className="h-6">
         <AnimatePresence>
           {error && (
             <motion.p 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-[12px] font-black text-rose-500 uppercase tracking-[0.2em] pl-4 flex items-center gap-2"
             >
               <AlertCircle className="h-4 w-4" /> {error}
             </motion.p>
           )}
         </AnimatePresence>
       </div>
    </div>
  );
}

function SettingsView({ health }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-12 pb-32">
      <div className="bg-white p-12 rounded-[4rem] border border-white shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-600" />
        <h1 className="text-4xl font-black text-slate-900 font-display tracking-tighter uppercase leading-none">System Settings</h1>
        <p className="text-slate-500 font-bold text-lg mt-4 uppercase tracking-[0.2em] opacity-60">Platform Control & Integration Matrix</p>
      </div>

      <div className="bg-white rounded-[4rem] p-16 border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] space-y-16">
          <section className="space-y-10">
              <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-400 pb-4 border-b-2 border-slate-50">Integration Status</h3>
              <div className="space-y-6">
                 <div className="group flex items-center justify-between p-8 bg-slate-100 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-600/20 hover:bg-white transition-all shadow-inner hover:shadow-2xl">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"><Database className="h-8 w-8 text-indigo-600" /></div>
                       <div>
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Google Sheets Master</p>
                          <p className="text-[11px] font-black text-indigo-400 mt-1 uppercase tracking-[0.2em]">{health.db === 'demo' ? 'DEMO MODE (Simulation)' : 'PRODUCTION (Connected)'}</p>
                       </div>
                    </div>
                    <div className={cn("h-4 w-4 rounded-full shadow-lg ring-8", health.db === 'disconnected' ? "bg-rose-500 ring-rose-100" : "bg-emerald-500 ring-emerald-100 animate-pulse")} />
                 </div>
                 <div className="group flex items-center justify-between p-8 bg-slate-100 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-600/20 hover:bg-white transition-all shadow-inner hover:shadow-2xl">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"><Globe className="h-8 w-8 text-indigo-600" /></div>
                       <div>
                          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Enterprise SES Dispatcher</p>
                          <p className="text-[11px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">v2.1 SES Gateway • Secure</p>
                       </div>
                    </div>
                    <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-lg ring-8 ring-emerald-100" />
                 </div>
              </div>
          </section>

          <section className="space-y-10">
              <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-400 pb-4 border-b-2 border-slate-50">Experimental Features</h3>
              <div className="flex items-center justify-between p-8 bg-slate-100 rounded-[2.5rem] opacity-40 grayscale pointer-events-none">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-md"><Plus className="h-8 w-8 text-slate-400" /></div>
                     <div>
                        <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Neural Dark Mode (Beta)</p>
                        <p className="text-[11px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">Locked: Security evaluation pending</p>
                     </div>
                  </div>
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
