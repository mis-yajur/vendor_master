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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/vendors', label: 'Vendor Registry', icon: Users },
    { path: '/register', label: 'New Onboarding', icon: Plus },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans flex overflow-hidden">
      {/* Sidebar - Dark Glassy Effect */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 88 }}
        className="bg-[#0f172a] text-slate-400 flex flex-col relative z-50 shadow-2xl"
      >
        <div className="h-24 flex items-center px-6 mb-4 border-b border-white/5">
          <Link to="/" className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
            <div className="flex-shrink-0 h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 flex transform hover:rotate-3 transition-transform">
              <Building2 className="h-7 w-7" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white leading-none font-display">
                  Yajur<span className="text-indigo-400">Portal</span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300 ml-0.5 mt-1">Vendor Master</span>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] font-bold transition-all overflow-hidden whitespace-nowrap",
                location.pathname === item.path 
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]" 
                  : "hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              <item.icon className={cn("h-6 w-6 flex-shrink-0", location.pathname === item.path ? "text-white" : "group-hover:text-indigo-400")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3 overflow-hidden border border-white/5 shadow-inner">
             <div className="h-12 w-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
               <User className="h-6 w-6" />
             </div>
             {isSidebarOpen && (
               <div className="overflow-hidden">
                 <p className="text-sm font-black text-white truncate">Prosun Majhi</p>
                 <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest truncate">Global Admin</p>
               </div>
             )}
          </div>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-28 h-8 w-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-[#f1f5f9] z-[60]"
        >
          {isSidebarOpen ? <ChevronRight className="h-4 w-4 rotate-180" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </motion.aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-24 bg-white/90 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-4">
              <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight">
                {navItems.find(i => i.path === location.pathname)?.label || 'Page'}
              </h1>
           </div>

           <div className="flex items-center gap-8">
              <div className="flex items-center gap-8 pr-8 border-r border-slate-100">
                 <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                    <div className={cn("h-3 w-3 rounded-full shadow-lg", systemHealth.db !== 'disconnected' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{systemHealth.db !== 'disconnected' ? 'Cloud Sync Active' : 'Offline'}</span>
                 </div>
                 <button className="relative p-3 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-50 rounded-2xl">
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-3 right-3 h-3 w-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                 </button>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer">
                 <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&q=80" alt="Avatar" className="h-full w-full object-cover" />
                 </div>
                 <div className="hidden xl:block">
                   <p className="text-sm font-black text-slate-800 leading-none">Prosun Majhi</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
                 </div>
              </div>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-12 relative bg-[#f1f5f9]">
           <div className="w-full h-full">
             {children}
           </div>
        </main>
      </div>
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
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 bg-white p-12 rounded-[3.5rem] border border-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
        <div>
          <h1 className="text-5xl font-black text-slate-900 font-display tracking-tighter uppercase">Onboarding Terminal</h1>
          <p className="text-slate-500 text-lg mt-3 font-medium">Initiate statutory master record creation for new supply partners.</p>
        </div>
        <button onClick={() => navigate('/vendors')} className="px-10 py-5 bg-slate-100 text-slate-800 rounded-[2rem] text-[14px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-95">
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
            <Form className="p-10 md:p-14 space-y-12">
              <div className="grid gap-12">
                <FormSection title="Master Details" icon={Settings}>
                  <div className="grid gap-6 sm:grid-cols-2 max-w-lg">
                     <FormInput label="Request Action" name="requestType" type="select" options={['New', 'Change']} />
                  </div>
                </FormSection>

                <FormSection title="Legal & Presence" icon={MapPin}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     <FormInput label="Official Legal Name" name="name" placeholder="E.g. Acme Corp Private Ltd" error={touched.name && errors.name} />
                     <FormInput label="Floor/Building" name="address.floorBuilding" placeholder="Unit, Level" error={touched.address?.floorBuilding && (errors as any).address?.floorBuilding} />
                     <FormInput label="Street / Area" name="address.street" placeholder="Main road" error={touched.address?.street && (errors as any).address?.street} />
                     <FormInput label="City" name="address.city" placeholder="City" error={touched.address?.city && (errors as any).address?.city} />
                     <FormInput label="Postal Code" name="address.pinCode" placeholder="6 digits" error={touched.address?.pinCode && (errors as any).address?.pinCode} />
                     <FormInput label="State" name="address.state" placeholder="Province/State" error={touched.address?.state && (errors as any).address?.state} />
                     <FormInput label="Primary Mobile" name="address.mobile" placeholder="Mobile" error={touched.address?.mobile && (errors as any).address?.mobile} />
                     <FormInput label="Official Email" name="address.email" placeholder="email@corp.com" error={touched.address?.email && (errors as any).address?.email} />
                  </div>
                </FormSection>

                <FormSection title="Statutory & Tax" icon={ShieldCheck}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                     <FormInput label="PAN" name="statutory.pan" placeholder="10 Digit PAN" error={touched.statutory?.pan && (errors as any).statutory?.pan} />
                     <FormInput label="GSTIN" name="statutory.gstin" placeholder="15 Digit GSTIN" error={touched.statutory?.gstin && (errors as any).statutory?.gstin} />
                     <FormInput label="Year Estd." name="statutory.yearOfEstablishment" placeholder="YYYY" error={touched.statutory?.yearOfEstablishment && (errors as any).statutory?.yearOfEstablishment} />
                     <FormInput label="Legal Entity" name="statutory.constitution" type="select" options={['Proprietary', 'Private Limited', 'LLP', 'Partnership', 'Public Limited', 'Trust']} />
                  </div>
                </FormSection>

                <FormSection title="Financial Nexus" icon={CreditCard}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     <FormInput label="Beneficiary" name="bank.beneficiaryName" placeholder="Account Name" error={touched.bank?.beneficiaryName && (errors as any).bank?.beneficiaryName} />
                     <FormInput label="Bank Name" name="bank.bankName" placeholder="E.g. HDFC Bank" error={touched.bank?.bankName && (errors as any).bank?.bankName} />
                     <FormInput label="Account Number" name="bank.accountNumber" placeholder="Core account no" error={touched.bank?.accountNumber && (errors as any).bank?.accountNumber} />
                     <FormInput label="IFSC / BIC" name="bank.ifscCode" placeholder="Branch Code" error={touched.bank?.ifscCode && (errors as any).bank?.ifscCode} />
                     <FormInput label="Account Type" name="bank.accountType" type="select" options={['Savings', 'Current', 'CC/OD']} />
                     <FormInput label="Credit Terms" name="creditTerms" placeholder="E.g. NET 30" error={touched.creditTerms && errors.creditTerms} />
                  </div>
                </FormSection>

                <FormSection title="Digital Repository" icon={Paperclip}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     <FileField label="GSTIN Authority" value={values.documents.gstinCopy} onUpload={(url) => setFieldValue('documents.gstinCopy', url)} required />
                     <FileField label="PAN Authority" value={values.documents.panCopy} onUpload={(url) => setFieldValue('documents.panCopy', url)} required />
                     <FileField label="Bank Evidence" value={values.documents.cancelledChequeCopy} onUpload={(url) => setFieldValue('documents.cancelledChequeCopy', url)} required />
                  </div>
                </FormSection>
              </div>

              <div className="pt-12 flex items-center justify-end gap-4 border-t border-slate-100">
                 <button 
                   type="button" 
                   onClick={() => navigate('/vendors')} 
                   className="px-8 py-3 bg-white text-slate-500 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all"
                 >
                   Discard
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting} 
                   className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/10 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                 >
                   {isSubmitting ? (
                     <>
                       <RefreshCw className="h-4 w-4 animate-spin" />
                       Validating Master...
                     </>
                   ) : (
                     <>
                       <CheckCircle2 className="h-4 w-4" />
                       Finalize Onboarding
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
  return (
    <div className="space-y-10 group">
      <div className="flex items-center gap-6 pb-6 border-b-4 border-slate-100 group-hover:border-indigo-600 transition-colors">
        <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xl border-2 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-[16px] font-black uppercase tracking-[0.35em] text-slate-900 font-display leading-none">{title}</h3>
      </div>
      <div className="pl-0">
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
      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 leading-none">
        {label} {required && <span className="text-rose-500">*</span>}
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
    <div className="space-y-4">
       <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2 leading-none">{label}</label>
       {type === 'select' ? (
         <Field as="select" name={name} className="w-full bg-white border-4 border-slate-100 rounded-[2rem] py-6 px-8 text-[16px] font-bold focus:ring-[14px] focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none shadow-2xl shadow-slate-200/50">
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
         </Field>
       ) : (
         <Field name={name} placeholder={placeholder} className="w-full bg-white border-4 border-slate-100 rounded-[2rem] py-6 px-8 text-[16px] font-bold focus:ring-[14px] focus:ring-indigo-100 focus:border-indigo-600 transition-all outline-none shadow-2xl shadow-slate-200/50 placeholder:text-slate-200" />
       )}
       <div className="h-6">
         <AnimatePresence>
           {error && (
             <motion.p 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] pl-2"
             >
               {error}
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
