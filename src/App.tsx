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
    <div className="min-h-screen bg-[#f8fafc] font-sans flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#0f172a] text-slate-400 flex flex-col relative z-50 border-r border-slate-800"
      >
        <div className="h-20 flex items-center px-6 mb-8 border-b border-slate-800/50">
          <Link to="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="flex-shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 flex">
              <Building2 className="h-6 w-6" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-none font-display">
                  Yajur<span className="text-indigo-400">Portal</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-1">Vendor Master</span>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all overflow-hidden whitespace-nowrap",
                location.pathname === item.path 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", location.pathname === item.path ? "text-white" : "group-hover:text-indigo-400")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <div className="bg-slate-800/40 rounded-2xl p-4 flex items-center gap-3 overflow-hidden">
             <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
               <User className="h-5 w-5 text-indigo-400" />
             </div>
             {isSidebarOpen && (
               <div className="overflow-hidden">
                 <p className="text-xs font-bold text-white truncate">Prosun Majhi</p>
                 <p className="text-[10px] text-slate-500 truncate">Global Admin</p>
               </div>
             )}
          </div>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 h-6 w-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-[#f8fafc] z-[60]"
        >
          {isSidebarOpen ? <ChevronRight className="h-3 w-3 rotate-180" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-slate-800 font-display">
                {navItems.find(i => i.path === location.pathname)?.label || 'Page'}
              </h1>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-6 pr-6 border-r border-slate-100">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                    <div className={cn("h-2 w-2 rounded-full", systemHealth.db !== 'disconnected' ? "bg-emerald-500" : "bg-rose-500")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{systemHealth.db !== 'disconnected' ? 'Cloud Live' : 'Offline'}</span>
                 </div>
                 <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
                 </button>
              </div>
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&q=80" alt="Avatar" className="h-full w-full object-cover" />
                 </div>
              </div>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           <div className="w-full max-w-full">
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
    { label: 'Active Registry', value: vendorsArray.length.toString(), icon: Users, color: 'indigo', description: 'Verified partners' },
    { label: 'Material Supply', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Goods').length.toString(), icon: Box, color: 'emerald', description: 'Goods vendors' },
    { label: 'Key Services', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Services').length.toString(), icon: Activity, color: 'amber', description: 'Service providers' },
    { label: 'Pending Review', value: vendorsArray.filter(v => v.requestType === 'New').length.toString(), icon: Clock, color: 'rose', description: 'Queue' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 font-display flex items-center gap-3">
             Command Center
             <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-lg tracking-widest">v2.0</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Monitor vendor health and onboarding performance in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/vendors')}
            className="px-5 py-2.5 bg-white text-slate-700 rounded-xl text-sm font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            Manage Fleet
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Onboarding
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'amber' ? "bg-amber-50 text-amber-600" : 
                "bg-rose-50 text-rose-600"
              )}>
                <stat.icon className="h-6 w-6" />
              </div>
              <TrendingUp className="h-4 w-4 text-slate-200" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight font-display">{stat.value}</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">{stat.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-display">Performance Metrics</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of vendor batches by classification</p>
            </div>
            <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100">
               <option>Last 30 Days</option>
               <option>Last Quarter</option>
            </select>
          </div>
          
          <div className="flex-1 p-8">
            <div className="h-[300px] w-full flex items-end justify-around gap-4 group/chart">
              {[65, 40, 85, 30, 55, 90, 45].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                   <div className="w-full max-w-[40px] relative group flex flex-col justify-end h-full">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1, type: 'spring' }}
                        className="bg-indigo-500 rounded-t-xl group-hover:bg-indigo-600 transition-colors cursor-pointer relative"
                      >
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                           Batch {i+1}: {h} units
                         </div>
                      </motion.div>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h/2}%` }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        className="bg-slate-200 rounded-t-lg absolute bottom-0 w-full"
                      />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Q{i+1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-3xl shadow-xl p-8 text-white flex flex-col relative overflow-hidden group">
           <div className="relative z-10 flex-1">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-8 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                 <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-3 text-white leading-tight">Identity & Trust</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Enterprise-grade validation for every vendor. Automated KYC and statutory checks ensured.
              </p>
              
              <div className="space-y-3">
                 {[
                   { label: 'GSTIN Verified', val: '98%' },
                   { label: 'PAN Validated', val: '100%' },
                   { label: 'Bank Sync', val: 'Live' }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{item.label}</span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-400">{item.val}</span>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="mt-8 relative z-10">
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group">
                 Security Audit
                 <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
           
           <Building2 className="absolute -right-16 -bottom-16 h-64 w-64 text-white/5 group-hover:rotate-6 transition-transform duration-1000" />
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 font-display">Vendor Registry</h2>
          <p className="text-slate-500 text-sm mt-1">Search and manage verified business partners.</p>
          
          <div className="relative mt-6 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by name, GSTIN, PAN or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
             <Download className="h-4 w-4" /> Export
           </button>
           <Link to="/register" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 active:scale-95 transition-all">
             <Plus className="h-4 w-4" /> Register
           </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
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
    <div className="group bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:border-indigo-200 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
          {vendor.name.charAt(0)}
        </div>
        <div className="flex flex-col items-end">
           <span className={cn(
             "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
             vendor.statutory.vendorType === 'Goods' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
           )}>
             {vendor.statutory.vendorType}
           </span>
           <p className="text-[10px] font-bold text-slate-300 mt-3 uppercase tracking-widest">{vendor.id}</p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-800 font-display line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase">{vendor.name}</h3>
        <div className="flex items-center gap-2 mt-1.5 mb-6 text-slate-400">
           <MapPin className="h-3 w-3" />
           <p className="text-xs font-medium">{vendor.address.city}, {vendor.address.state}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tax ID</p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{vendor.statutory.pan}</p>
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTIN</p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-tight truncate">{vendor.statutory.gstin}</p>
           </div>
        </div>
      </div>

      <button onClick={onSelect} className="mt-6 w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-[#0f172a] hover:text-white hover:border-[#0f172a] transition-all active:scale-95">
        View Profile
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-display">Onboarding Terminal</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Complete the vendor master information to initiate partnership.</p>
        </div>
        <button onClick={() => navigate('/vendors')} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
          Exit Wizard
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
           <motion.div 
             initial={{ width: '0%' }}
             animate={{ width: '100%' }}
             transition={{ duration: 1 }}
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
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 font-display">{title}</h3>
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
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className={cn(
        "relative h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 overflow-hidden",
        value ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white"
      )}>
        {uploading ? (
          <div className="flex flex-col items-center gap-1 text-indigo-600 animate-pulse">
            <RefreshCw className="h-5 w-5 animate-spin mb-1" />
            <span className="text-[9px] font-bold uppercase">Processing...</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Verified</span>
          </div>
        ) : (
          <>
            <Upload className="h-4 w-4 text-slate-300" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Target File</span>
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
         <Field as="select" name={name} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-[3px] focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none">
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
         </Field>
       ) : (
         <Field name={name} placeholder={placeholder} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-[3px] focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none placeholder:text-slate-300" />
       )}
       <div className="h-4">
         <AnimatePresence>
           {error && (
             <motion.p 
               initial={{ opacity: 0, y: -5 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-[9px] font-bold text-rose-500 uppercase tracking-widest pl-1"
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
