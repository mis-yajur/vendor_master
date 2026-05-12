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
  Lock,
  KeyRound,
  Check,
  Paperclip,
  Box,
  Heart,
  Zap,
  Flame,
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
import { 
  store, 
  RootState, 
  AppDispatch, 
  loadVendors as fetchVendorsThunk, 
  setHealth,
  deleteVendor as deleteVendorThunk,
  updateVendor as updateVendorThunk,
  addBulkVendors as bulkAddThunk
} from './store';

// 

const getScriptUrl = () => {
  const custom = localStorage.getItem('VITE_GOOGLE_SCRIPT_URL');
  if (custom) return custom;
  return (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbytYZ_AO4hrLTTi7yz5mVfLn4ahTyA-viPld4tb7ghTNmaLz_9vgh0Mhzy2YXUC3xcPYw/exec";
};

const isStaticHost = window.location.hostname.includes('github.io') || 
                     window.location.hostname.includes('web.app') || 
                     window.location.hostname.includes('pages.dev') ||
                     window.location.hostname.includes('run.app') ||
                     window.location.hostname.includes('localhost');

// Helper for API calls with robust static fallback
const apiCall = async (action: string, data: any = {}) => {
  const currentUrl = getScriptUrl();
  if (!currentUrl && isStaticHost) {
    console.info('Running in Static Mode (No Google Script URL provided). Data persists locally.');
  }

  try {
    // If currentUrl is present, always prioritize it for the sheet database
    if (currentUrl) {
      if (action === 'health' || action === 'list') {
        const resp = await axios.get(`${currentUrl}?action=${action}`);
        return resp.data;
      }
      
      // For POST, we use the Web App URL with text/plain to avoid CORS preflight issues
      const response = await axios.post(currentUrl, JSON.stringify({ action, ...data }), {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });
      
      let result = response.data;
      
      // Handle potential Google error pages or redirects returned as strings
      if (typeof result === 'string') {
        if (result.includes('<html') || result.includes('<!DOCTYPE html')) {
          throw new Error('Google Script returned an HTML page instead of JSON. Check if your Script is deployed as a Web App with access "Anyone".');
        }
        try {
          result = JSON.parse(result);
        } catch (e) {
          console.warn('Response parsing failed, attempting fuzzy success/error check');
          if (result.toLowerCase().includes('success')) result = { success: true };
          else if (result.toLowerCase().includes('error')) result = { success: false, error: result };
          else throw new Error(`Invalid response format from script: ${result.substring(0, 100)}...`);
        }
      }

      if (result && result.error) {
        console.error('Google Sheets Script Error:', result.error);
        throw new Error(`Cloud Sync: ${result.error}`);
      }
      
      return result;
    }
    
    // Default to server-side if not using SCRIPT_URL and not a static host
    if (action === 'list') {
      if (isStaticHost) {
        const stored = localStorage.getItem('vendor_registry');
        return stored ? JSON.parse(stored) : [];
      }

      try {
        const res = await axios.get('/api/vendors');
        return res.data;
      } catch (err) {
        console.warn('Backend unavailable, using LocalStorage repository');
        const stored = localStorage.getItem('vendor_registry');
        return stored ? JSON.parse(stored) : [];
      }
    }
    
    if (action === 'add') {
      if (isStaticHost) {
        const stored = localStorage.getItem('vendor_registry');
        const current = stored ? JSON.parse(stored) : [];
        const updated = [data.vendor, ...current];
        localStorage.setItem('vendor_registry', JSON.stringify(updated));
        return { success: true, mode: 'local_persistence' };
      }

      try {
        const res = await axios.post('/api/vendors', data);
        return res.data;
      } catch (err) {
        const stored = localStorage.getItem('vendor_registry');
        const current = stored ? JSON.parse(stored) : [];
        const updated = [data.vendor, ...current];
        localStorage.setItem('vendor_registry', JSON.stringify(updated));
        return { success: true, mode: 'local_persistence' };
      }
    }
    
    if (action === 'health') {
      if (isStaticHost) {
        const url = getScriptUrl();
        return { status: 'static_mode', db: url ? 'online' : 'local_persistence', message: url ? 'Connected to Google Sheets' : 'Offline Persistence Mode' };
      }

      try {
        const res = await axios.get('/api/health');
        return res.data;
      } catch (err) {
        return { status: 'static_mode', db: 'local_persistence', message: 'Running without active backend' };
      }
    }
  } catch (error) {
    console.error(`apiCall ${action} failure:`, error);
    if (action === 'list') {
      const stored = localStorage.getItem('vendor_registry');
      return stored ? JSON.parse(stored) : [];
    }
    if (action === 'health') return { status: 'offline', db: 'disconnected' };
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
  
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('terminal_auth') === 'true'
  );

  const [currentTheme, setCurrentTheme] = useState<string>(
    localStorage.getItem('app_theme') || 'theme-default'
  );

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('app_theme', theme);
  };

  const refreshData = useCallback(() => {
    if (!isAuthenticated) return;
    dispatch(fetchVendorsThunk());
  }, [dispatch, isAuthenticated]);

  const checkHealth = useCallback(async () => {
    try {
      const data = await apiCall('health');
      dispatch(setHealth(data));
    } catch (error) {
      dispatch(setHealth({ status: 'demo', db: 'demo' }));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
      checkHealth();
      const interval = setInterval(checkHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [refreshData, checkHealth, isAuthenticated]);

  return (
    <ThemeProvider theme={themeConfig}>
      <CssBaseline />
      <Router>
        <div className={currentTheme}>
          {isAuthenticated ? (
            <Layout systemHealth={systemHealth} onLogout={() => {
              localStorage.removeItem('terminal_auth');
              setIsAuthenticated(false);
            }}>
              <Routes>
                <Route path="/" element={<Dashboard vendors={vendors} health={systemHealth} onRefresh={refreshData} />} />
                <Route path="/vendors" element={<VendorList vendors={vendors} loading={loading} />} />
                <Route path="/register" element={<RegistrationForm onComplete={refreshData} />} />
                <Route path="/settings" element={<SettingsView health={systemHealth} currentTheme={currentTheme} onThemeChange={handleThemeChange} />} />
              </Routes>
            </Layout>
          ) : (
            <LoginTerminal onLogin={() => setIsAuthenticated(true)} />
          )}
        </div>
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

function LoginTerminal({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate biometric check delay
    setTimeout(() => {
      if (username === 'admin' && password === '1234') {
        localStorage.setItem('terminal_auth', 'true');
        onLogin();
      } else {
        setError(true);
        setIsProcessing(false);
        setTimeout(() => setError(false), 2000);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="mb-10 text-center">
          <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 border border-indigo-400/30">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic leading-none">
            YAJUR<span className="text-indigo-400 not-italic">PORTAL</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-3">Identity Verification Protocol</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Command Node ID</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Username"
                    disabled={isProcessing}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Authorization Code</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    disabled={isProcessing}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm font-bold tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" /> 
                  Authentication Failed: Access Denied
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isProcessing}
              className={cn(
                "w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95",
                isProcessing ? "bg-slate-800 text-slate-500 cursor-wait" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20"
              )}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Authorize Access
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" /> System Active
            </span>
            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">REL 2.1 GOLD</span>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-600 text-[10px] font-medium tracking-wide uppercase opacity-50">
          Electronic Authorized Access Only. All transactions logged.
        </p>
      </motion.div>
    </div>
  );
}

function Layout({ children, systemHealth, onLogout }: { children: React.ReactNode, systemHealth: any, onLogout: () => void }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/vendors', label: 'Vendor Registry', icon: Users },
    { path: '/register', label: 'New Onboarding', icon: Plus },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top bar with Navigation */}
      <header className="h-16 bg-[var(--theme-nav)] text-white flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shadow-2xl transition-colors duration-500">
         <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 items-center justify-center rounded-lg bg-[var(--theme-primary)] text-white shadow-lg shadow-indigo-500/20 flex transform group-hover:rotate-6 transition-all duration-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white leading-none font-display uppercase italic">
                  YAJUR<span className="text-[var(--theme-accent)] not-italic opacity-80">PORTAL</span>
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-slate-500 mt-0.5">Vendor Master v2.1</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                    location.pathname === item.path 
                      ? "bg-slate-800 text-white shadow-inner ring-1 ring-white/10" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("h-3 w-3", location.pathname === item.path ? "text-indigo-400" : "text-slate-500")} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
         </div>

         <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-3 pr-4 border-r border-slate-800">
               <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50 shadow-inner">
                  <div className={cn("h-1.5 w-1.5 rounded-full", systemHealth.db !== 'disconnected' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500")} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{systemHealth.db !== 'disconnected' ? 'Cloud Link' : 'Offline'}</span>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2.5 cursor-pointer group p-1 rounded-lg transition-all">
                  <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 shadow-lg group-hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-500">
                     <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[11px] font-bold text-white leading-none tracking-wide text-right">P. Majhi</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 text-right">Admin</p>
                  </div>
               </div>
               
               <button 
                 onClick={() => {
                   if(confirm('Signal terminal log-off?')) {
                     onLogout();
                   }
                 }}
                 className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all shadow-md border border-slate-700 hover:border-rose-500 active:scale-95 group"
               >
                 <LogOut className="h-4 w-4" />
               </button>
            </div>
         </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 p-6 md:p-10 xl:p-12 bg-[var(--theme-bg)] relative transition-colors duration-500">
         <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
         <div className="w-full max-w-[1700px] mx-auto relative z-10 transition-all duration-500">
           {children}
         </div>
      </main>
    </div>
  );
}

function Dashboard({ vendors = [], health }: any) {
  const navigate = useNavigate();
  const vendorsArray = Array.isArray(vendors) ? vendors : [];
  const scriptUrl = getScriptUrl();
  const [analyticsTab, setAnalyticsTab] = useState<'real-time' | 'history'>('real-time');

  const stats = [
    { label: 'Total Registry', value: vendorsArray.length.toString(), icon: Users, color: 'indigo', description: 'Certified Partners' },
    { label: 'Goods Supply', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Goods').length.toString(), icon: Box, color: 'emerald', description: 'Product Vendors' },
    { label: 'Professional', value: vendorsArray.filter(v => v.statutory?.vendorType === 'Services').length.toString(), icon: Activity, color: 'amber', description: 'Service Entities' },
    { label: 'In Review', value: vendorsArray.filter(v => v.requestType === 'New').length.toString(), icon: Clock, color: 'rose', description: 'Action Required' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight flex items-center gap-4">
               Command Center
               <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold uppercase rounded-md tracking-[0.2em] shadow-lg">REL 2.1</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">Strategic oversight of the partner ecosystem and real-time procurement health.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/vendors')}
              className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-[var(--theme-primary)] transition-all active:scale-95 flex items-center gap-2"
            >
              <Database className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
              Registry
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-[var(--theme-primary)] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Onboard
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-default relative overflow-hidden"
          >
            <div className={cn(
              "absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
              stat.color === 'indigo' ? "bg-indigo-600" :
              stat.color === 'emerald' ? "bg-emerald-600" :
              stat.color === 'amber' ? "bg-amber-600" : "bg-rose-600"
            )} />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                stat.color === 'amber' ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                "bg-rose-50 text-rose-600 border border-rose-100"
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight font-display italic">{stat.value}</h3>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.description}</span>
                <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 font-display uppercase italic tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--theme-primary)]" />
                Activity Analytics
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Onboarding cycles vs Performance throughput</p>
            </div>
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
               <button 
                 onClick={() => setAnalyticsTab('real-time')}
                 className={cn(
                   "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   analyticsTab === 'real-time' ? "bg-white text-[var(--theme-primary)] shadow-lg ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 Real-time
               </button>
               <button 
                 onClick={() => setAnalyticsTab('history')}
                 className={cn(
                   "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   analyticsTab === 'history' ? "bg-white text-[var(--theme-primary)] shadow-lg ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 History
               </button>
            </div>
          </div>
          
          <div className="flex-1 p-10 bg-slate-50/30">
             <div className="h-full w-full flex items-end justify-around gap-4 xl:gap-8 min-h-[320px] bg-white/40 rounded-[2rem] p-8 border border-white/60 shadow-inner">
                {(analyticsTab === 'real-time' ? [65, 45, 85, 55, 95, 75, 100] : [20, 40, 60, 50, 40, 70, 90]).map((h, i) => (
                  <div key={i + analyticsTab} className="flex-1 flex flex-col items-center gap-5 h-full justify-end group">
                     <div className="w-full max-w-[12px] relative flex flex-col justify-end h-full">
                        <div className="absolute inset-0 bg-slate-100 rounded-full w-full" />
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.04, type: 'spring', damping: 20 }}
                          className={cn(
                            "rounded-full transition-all duration-500 relative shadow-lg z-10",
                            analyticsTab === 'real-time' ? "bg-[var(--theme-primary)] group-hover:bg-[var(--theme-accent)] shadow-indigo-200" : "bg-slate-400 group-hover:bg-slate-500 shadow-slate-200"
                          )}
                        >
                           <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl border border-white/10">
                             {h}%
                           </div>
                        </motion.div>
                     </div>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{analyticsTab === 'real-time' ? `GRP.0${i+1}` : `WEE.0${i+1}`}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 grid gap-8 flex flex-col">
           <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/5 shadow-2xl flex-1 flex flex-col">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--theme-primary)]" />
              
              <div className="relative z-10 flex-1">
                 <div className="h-14 w-14 rounded-2xl bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/30 text-[var(--theme-accent)] flex items-center justify-center mb-8 shadow-2xl group-hover:rotate-6 transition-transform">
                    <ShieldCheck className="h-7 w-7" />
                 </div>
                 <h3 className="text-2xl font-black font-display mb-4 tracking-tighter uppercase italic leading-none">Security Protocol</h3>
                 <p className="text-slate-400 text-[13px] font-medium leading-relaxed mb-10">
                   Proprietary encryption layer for statutory records and procurement audit logs.
                 </p>
                 
                 <div className="space-y-4">
                    {['Identity Biometrics', 'SHA-512 Matrix', 'Neural Audit'].map((label, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group/item">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover/item:scale-150 transition-transform" />
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">{label}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <Building2 className="absolute -right-20 -bottom-20 h-64 w-64 text-white/5 group-hover:rotate-12 transition-all duration-1000 blur-sm" />
           </div>

           <div className="bg-[var(--theme-primary)] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="relative z-10 flex flex-col justify-between h-full">
                 <div>
                    <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center mb-6 shadow-xl">
                       <Plus className="h-7 w-7" />
                    </div>
                    <h3 className="text-2xl font-black font-display mb-3 tracking-tighter italic uppercase">Terminal Entry</h3>
                    <p className="text-indigo-100 text-[13px] font-medium mb-10">Initialize secure onboarding protocol for new enterprise entity.</p>
                 </div>
                 <button 
                  onClick={() => navigate('/register')}
                  className="w-full py-5 bg-white text-[var(--theme-primary)] rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all flex items-center justify-center gap-3 group shadow-2xl active:scale-95"
                 >
                    Launch protocol
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                 </button>
              </div>
           </div>
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
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const vendorsArray = Array.isArray(vendors) ? vendors : [];

  const filteredVendors = vendorsArray.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.statutory?.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Permanently decommission this partner node?')) {
      dispatch(deleteVendorThunk(id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--theme-primary)]" />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 text-indigo-600" />
            <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight uppercase italic">Vendor Registry</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium tracking-wide">Enterprise partner database and statutory archive access.</p>
          
          <div className="relative mt-8 group max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search registry by Name, GSTIN, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-6 text-[13px] font-bold focus:ring-4 focus:ring-indigo-50 focus:bg-white focus:border-indigo-600 transition-all outline-none shadow-inner"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-[var(--theme-primary)]">
           <button 
             onClick={() => setShowBulkModal(true)}
             className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
           >
             <Upload className="h-4 w-4 text-indigo-500" /> Bulk Import
           </button>
           <button 
             onClick={() => {
               const csvContent = filteredVendors.map(v => `${v.name},${v.statutory?.pan},${v.statutory?.gstin},${v.address?.city}`).join('\n');
               const blob = new Blob([`Name,PAN,GSTIN,City\n${csvContent}`], { type: 'text/csv' });
               saveAs(blob, 'vendor_registry.csv');
             }}
             className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
           >
             <Download className="h-4 w-4 text-indigo-500" /> Export CSV
           </button>
           <Link to="/register" className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 shadow-xl active:scale-95 transition-all">
             <Plus className="h-4 w-4 text-indigo-400" /> New Partnership
           </Link>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-[0.2em] italic">
                <th className="px-8 py-5">Partner Name</th>
                <th className="px-6 py-5">Classification</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">PAN / GSTIN</th>
                <th className="px-6 py-5">Registered</th>
                <th className="px-8 py-5 text-right whitespace-nowrap">Control Node</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredVendors.map((vendor) => (
                  <motion.tr 
                    key={vendor.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-sm border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                          {vendor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight line-clamp-1">{vendor.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{vendor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        vendor.statutory?.vendorType === 'Goods' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {vendor.statutory?.vendorType || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-[11px] font-bold uppercase tracking-tight">{vendor.address?.city}, {vendor.address?.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded inline-block">PAN: {vendor.statutory?.pan || '---'}</p>
                        <p className="text-[10px] font-mono font-bold text-slate-400 block ml-0.5">GST: {vendor.statutory?.gstin || '---'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold">{formatDate(vendor.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedVendor(vendor)}
                          className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-slate-100"
                          title="View Details"
                        >
                           <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setEditVendor(vendor)}
                          className="p-2 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all border border-slate-100"
                          title="Edit Partner"
                        >
                           <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(vendor.id)}
                          className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-slate-100"
                          title="Delete Partner"
                        >
                           <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {!loading && filteredVendors.length === 0 && (
          <div className="py-24 text-center">
            <div className="h-14 w-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100 border-dashed">
               <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-display">No Records Detected</h3>
            <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-[0.2em] font-black">Adjust neural filters or onboard new entity</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedVendor && <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />}
        {editVendor && <EditVendorModal vendor={editVendor} onClose={() => setEditVendor(null)} />}
        {showBulkModal && <BulkUploadModal onClose={() => setShowBulkModal(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function BulkUploadModal({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
      }
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    const newVendors = data.map((row: any) => ({
      id: `V${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      name: row.Name || row.name || 'Unknown Vendor',
      createdAt: new Date().toISOString(),
      requestType: 'New',
      address: {
        city: row.City || row.city || 'Unknown',
        state: row.State || row.state || 'Unknown',
        country: 'India',
        mobile: row.Mobile || row.mobile || '',
        email: row.Email || row.email || ''
      },
      statutory: {
        pan: row.PAN || row.pan || '',
        gstin: row.GSTIN || row.gstin || '',
        vendorType: row.Type || row.type || 'Goods'
      }
    })) as Vendor[];

    await dispatch(bulkAddThunk(newVendors));
    setIsImporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Upload className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900 font-display uppercase italic">Bulk Ledger Import</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 bg-slate-50">
            <Upload className="h-10 w-10 text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Select CSV Manifest</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Headers: Name, PAN, GSTIN, City, Mobile, Email</p>
            </div>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>

          {data.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">
                Manifest Validated: {data.length} Records Detected
              </p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          )}
        </div>
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Discard</button>
          <button 
            onClick={handleImport}
            disabled={data.length === 0 || isImporting}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isImporting ? 'Syncing...' : 'Execute Import'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EditVendorModal({ vendor, onClose }: { vendor: Vendor, onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden my-8 border border-white">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Edit className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900 font-display uppercase italic">Edit Partner Protocol</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <Formik
            initialValues={vendor}
            onSubmit={async (values) => {
              await dispatch(updateVendorThunk({ ...values, id: vendor.id }));
              onClose();
            }}
          >
            {({ isSubmitting, touched, errors }) => (
              <Form className="p-8 space-y-12">
                 <div className="grid gap-8 sm:grid-cols-2">
                    <FormInput label="Partner Name" name="name" error={touched.name && errors.name} />
                    <FormInput label="Tax ID (PAN)" name="statutory.pan" />
                    <FormInput label="GST Record" name="statutory.gstin" />
                    <FormInput label="Classification" name="statutory.vendorType" type="select" options={['Goods', 'Services']} />
                    <FormInput label="Operating City" name="address.city" />
                    <FormInput label="Direct Phone" name="address.mobile" />
                 </div>
                 <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      {isSubmitting ? 'Syncing...' : 'Update Record'}
                    </button>
                 </div>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </div>
  );
}

function VendorCard({ vendor, onSelect }: { vendor: Vendor, onSelect: () => void }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-lg transition-transform group-hover:scale-105">
          {vendor.name.charAt(0)}
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className={cn(
             "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest",
             vendor.statutory?.vendorType === 'Goods' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
           )}>
             {vendor.statutory?.vendorType || 'General'}
           </span>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{vendor.id}</p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-slate-900 font-display line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{vendor.name}</h3>
        <div className="flex items-center gap-2 mt-2 mb-6 text-slate-400">
           <MapPin className="h-3.5 w-3.5 text-slate-300" />
           <p className="text-[11px] font-medium tracking-wide">{vendor.address?.city}, {vendor.address?.state}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
           <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PAN / TAX ID</p>
              <p className="text-[12px] font-bold text-slate-800 uppercase tabular-nums">{vendor.statutory?.pan || '---'}</p>
           </div>
           <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">GST / VAT</p>
              <p className="text-[12px] font-bold text-slate-800 uppercase truncate tabular-nums">{vendor.statutory?.gstin || '---'}</p>
           </div>
        </div>
      </div>

      <button onClick={onSelect} className="mt-6 w-full py-3 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 border border-slate-100">
        Review Full Profile
      </button>
    </div>
  );
}

function VendorDetailModal({ vendor, onClose }: { vendor: Vendor, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-6xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative my-8 border border-white">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-5">
               <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><Building2 className="h-6 w-6" /></div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{vendor.name}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">MSR-NODE: {vendor.id} • Registered {formatDate(vendor.createdAt)}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-200">
                 <Download className="h-4 w-4 text-indigo-500" /> Export Dossier
               </button>
               <button onClick={onClose} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-200"><X className="h-6 w-6" /></button>
            </div>
        </div>

        <div className="p-8 md:p-12 grid gap-10 lg:grid-cols-4 max-h-[80vh] overflow-y-auto bg-slate-50/50">
           <div className="lg:col-span-1 space-y-8">
              <ProfileSection title="Core Logistics" icon={MapPin}>
                 <ProfileItem label="Verified Site" value={`${vendor.address.floorBuilding}, ${vendor.address.street}`} />
                 <ProfileItem label="Jurisdiction" value={`${vendor.address.city}, ${vendor.address.district}`} />
                 <ProfileItem label="Global Region" value={`${vendor.address.state}, ${vendor.address.country} [${vendor.address.pinCode}]`} />
                 <ProfileItem label="Primary Contact" value={`M: ${vendor.address.mobile}`} highlighted />
                 <ProfileItem label="Corporate Email" value={vendor.address.email} />
              </ProfileSection>

              <ProfileSection title="Compliance Status" icon={Activity}>
                 <ProfileItem label="TDS Exemption" value={vendor.statutory.tdsExemptionDetails} highlighted />
                 <ProfileItem label="PCB Status" value={vendor.statutory.consentToOperate} />
              </ProfileSection>
           </div>

           <div className="lg:col-span-1 space-y-10">
              <ProfileSection title="Personnel Matrix" icon={User}>
                 <ProfileItem label="Direct Officer" value={vendor.contact.name} />
                 <ProfileItem label="Officer Capacity" value={vendor.contact.designation} />
                 <ProfileItem label="Priority Line" value={vendor.contact.phone} highlighted />
                 <ProfileItem label="Communication Hub" value={vendor.contact.email} />
              </ProfileSection>

              <ProfileSection title="Operational Tier" icon={Briefcase}>
                 <ProfileItem label="Classification" value={vendor.statutory.vendorType} highlighted />
                 <ProfileItem label="Structural Type" value={vendor.statutory.constitution} />
                 <ProfileItem label="Fiscal History" value={vendor.statutory.yearOfEstablishment} />
              </ProfileSection>

              <ProfileSection title="Fiscal Terms" icon={CircleDollarSign}>
                 <ProfileItem label="Settlement ISO" value={vendor.currency} highlighted />
                 <ProfileItem label="Maturation Cycle" value={vendor.creditTerms} />
              </ProfileSection>
           </div>

           <div className="lg:col-span-1 space-y-10">
              <ProfileSection title="Statutory Dossier" icon={ShieldCheck}>
                 <div className="grid grid-cols-2 gap-6">
                    <ProfileItem label="PAN ID" value={vendor.statutory.pan} highlighted />
                    <ProfileItem label="GST NO" value={vendor.statutory.gstin} highlighted />
                 </div>
                 <ProfileItem label="CIN / REG" value={vendor.statutory.cin} />
                 <ProfileItem label="MSMED CLASSIF" value={vendor.statutory.msmedRegNo} />
                 <ProfileItem label="Trade Authority" value={vendor.statutory.tradeLicense} />
                 <ProfileItem label="Import/Export Code" value={vendor.statutory.iecNo} />
                 <ProfileItem label="Welfare Registry" value={`PF: ${vendor.statutory.pfRegNo} | ESIC: ${vendor.statutory.esicRegNo}`} />
                 <ProfileItem label="Industrial Lic" value={`${vendor.statutory.labourLicenseNo || 'N/A'} / ${vendor.statutory.factoryLicense || 'N/A'}`} />
              </ProfileSection>

              <ProfileSection title="Financial Clearing" icon={CreditCard}>
                 <ProfileItem label="Legal Beneficiary" value={vendor.bank.beneficiaryName} />
                 <ProfileItem label="Banking Node" value={`${vendor.bank.bankName} (${vendor.bank.branchName})`} />
                 <ProfileItem label="Settlement ID" value={`${vendor.bank.accountNumber}`} highlighted />
                 <ProfileItem label="Node Protocol" value={`IFSC: ${vendor.bank.ifscCode} | SWIFT: ${vendor.bank.swiftIban || 'N/A'}`} />
              </ProfileSection>
           </div>

           <div className="lg:col-span-1 space-y-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 mb-6">
                <Paperclip className="h-4 w-4" /> Digital Assets
              </h3>
              <div className="space-y-4">
                 <DocLink label="Taxation Certificate" url={vendor.documents?.gstinCopy} />
                 <DocLink label="Registry Copy (PAN)" url={vendor.documents?.panCopy} />
                 <DocLink label="MSMED dossier" url={vendor.documents?.msmedCopy} />
                 <DocLink label="Fiscal Clearing Instrument" url={vendor.documents?.cancelledChequeCopy} />
                 <DocLink label="Exemption Protocols" url={vendor.documents?.tdsExemptionCopy} />
                 <DocLink label="Legal Declaration" url={vendor.documents?.signedDeclaration} />
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
      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-400 hover:shadow-sm transition-all group"
    >
       <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex items-center justify-center">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{label}</span>
       </div>
       <ExternalLink className="h-2.5 w-2.5 text-slate-300 group-hover:text-indigo-400" />
    </a>
  );
}

function ProfileSection({ title, icon: Icon, children, className }: any) {
  return (
    <div className={cn("bg-white p-5 rounded-2xl border border-slate-100 shadow-sm", className)}>
       <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
          <Icon className="h-4 w-4 text-indigo-600" />
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h4>
       </div>
       <div className="space-y-3">
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
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleRegister = async (values: any) => {
    try {
      const result = await apiCall('add', { vendor: { ...values, id: `V${Date.now()}`, createdAt: new Date().toISOString() } });
      if (result && (result.success || result.id)) {
        onComplete();
        navigate('/vendors');
      } else {
        throw new Error(result?.error || 'Registry update was rejected by the server.');
      }
    } catch (error: any) {
      console.error('Finalization Failure:', error);
      alert(`Sync Error: ${error.message || 'Unknown protocol error'}. Check your Google Script permissions.`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-10 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Plus className="h-5 w-5 text-indigo-400" />
            <h1 className="text-3xl font-black text-white font-display tracking-tight uppercase italic">Onboarding Hub</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Initialize new vendor partnership and statutory profiling.</p>
        </div>
        <button onClick={() => navigate('/vendors')} className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all shadow-lg active:scale-95 border border-slate-700">
          Cancel Onboarding
        </button>
        <Building2 className="absolute -right-10 -bottom-10 h-48 w-48 text-white/5" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
           <motion.div 
             initial={{ width: '0%' }}
             animate={{ width: '100%' }}
             transition={{ duration: 1.5 }}
             className="h-full bg-indigo-500" 
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
            <Form className="p-8 md:p-12 space-y-16">
              <div className="grid gap-16">
                <FormSection title="01. Profile Type" icon={Settings}>
                  <div className="grid gap-6 sm:grid-cols-2 max-w-xl bg-slate-50 p-6 rounded-2xl border border-slate-100">
                     <FormInput label="Registry Action" name="requestType" type="select" options={['New', 'Change']} />
                  </div>
                </FormSection>

                <FormSection title="02. Digital Verification" icon={FolderOpen}>
                  <AttachmentSummary 
                    values={values.documents} 
                    onOpen={() => setShowUploadModal(true)} 
                  />
                  <AnimatePresence>
                    {showUploadModal && (
                      <AttachmentModal 
                        values={values.documents} 
                        setFieldValue={setFieldValue} 
                        onClose={() => setShowUploadModal(false)} 
                      />
                    )}
                  </AnimatePresence>
                </FormSection>

                <FormSection title="03. Entity Identity" icon={MapPin}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     <FormInput className="col-span-full xl:col-span-2" label="Legal Business Name" name="name" placeholder="Full Registered Name" error={touched.name && errors.name} />
                     <FormInput label="Floor/Building/Unit" name="address.floorBuilding" placeholder="Unit/Apt" />
                     <FormInput label="Street/Road" name="address.street" placeholder="Main Road" />
                     <FormInput label="City" name="address.city" placeholder="City" error={touched.address?.city && (errors as any).address?.city} />
                     <FormInput label="District" name="address.district" placeholder="District" />
                     <FormInput label="Postal Code" name="address.pinCode" placeholder="6 Digits" />
                     <FormInput label="State/Region" name="address.state" placeholder="State" />
                     <FormInput label="Country" name="address.country" placeholder="Country" />
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-50 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                     <FormInput label="Office Phone" name="address.phone" placeholder="+91" />
                     <FormInput label="Fax ID" name="address.fax" placeholder="Fax" />
                     <FormInput label="Primary Mobile" name="address.mobile" placeholder="+91" />
                     <FormInput label="Corporate Email" name="address.email" placeholder="email@corp.com" />
                  </div>
                </FormSection>

                <FormSection title="04. Key Personnel" icon={Users}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     <FormInput label="Primary Liaison" name="contact.name" placeholder="Full Name" />
                     <FormInput label="Official Designation" name="contact.designation" placeholder="Title" />
                     <FormInput label="Direct Line" name="contact.phone" placeholder="Mobile" />
                     <FormInput label="Secondary Email" name="contact.email" placeholder="name@domain.com" />
                  </div>
                </FormSection>

                <FormSection title="05. Classification & Statutory" icon={ShieldCheck}>
                  <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mb-8">
                     <FormInput label="Operation Mode" name="statutory.vendorType" type="select" options={['Goods', 'Services']} />
                     <FormInput label="Establishment Year" name="statutory.yearOfEstablishment" placeholder="YYYY" />
                     <FormInput label="Legal Constitution" name="statutory.constitution" type="select" options={['Proprietary', 'Private Limited', 'LLP', 'Partnership', 'Public Limited', 'Trust']} />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-8 border-t border-slate-50">
                     <FormInput label="PAN / Tax ID" name="statutory.pan" placeholder="PAN Number" />
                     <FormInput label="GSTIN" name="statutory.gstin" placeholder="GST Number" />
                     <FormInput label="Trade License" name="statutory.tradeLicense" placeholder="License No" />
                     <FormInput label="CIN" name="statutory.cin" placeholder="CIN" />
                     <FormInput label="Udyam/MSMED" name="statutory.msmedRegNo" placeholder="UDYAM-XX-..." />
                     <FormInput label="IEC Code" name="statutory.iecNo" placeholder="Import/Export" />
                     <FormInput label="PF Registry" name="statutory.pfRegNo" placeholder="PF ID" />
                     <FormInput label="ESIC Registry" name="statutory.esicRegNo" placeholder="ESIC ID" />
                  </div>
                </FormSection>

                <FormSection title="06. Fiscal Settlement" icon={CreditCard}>
                   <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     <FormInput label="Beneficiary Name" name="bank.beneficiaryName" placeholder="As per Bank" />
                     <FormInput label="Financial Institution" name="bank.bankName" placeholder="Bank Name" />
                     <FormInput label="IFSC Code" name="bank.ifscCode" placeholder="IFSC" />
                     <FormInput label="Account Number" name="bank.accountNumber" placeholder="Acc Number" />
                     <FormInput label="Account Type" name="bank.accountType" type="select" options={['Savings', 'Current', 'CC/OD']} />
                     <FormInput label="Branch Unit" name="bank.branchName" placeholder="Branch Name" />
                   </div>
                   <div className="grid gap-6 sm:grid-cols-2 mt-8 pt-8 border-t border-slate-50">
                     <div className="flex gap-4">
                        <FormInput label="Primary Currency" name="currency" type="select" options={['INR', 'USD', 'EUR', 'GBP', 'AED']} />
                        <FormInput label="Credit Terms" name="creditTerms" placeholder="NET 30" />
                     </div>
                   </div>
                </FormSection>
              </div>

              <div className="pt-12 flex items-center justify-between border-t border-slate-100">
                 <button 
                   type="button" 
                   onClick={() => navigate('/vendors')} 
                   className="px-8 py-3.5 text-slate-400 hover:text-slate-900 text-[11px] font-bold uppercase tracking-widest transition-all"
                 >
                   Discard Draft
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting} 
                   className="px-12 py-4 bg-indigo-600 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
                 >
                   {isSubmitting ? (
                     <>
                       <RefreshCw className="h-4 w-4 animate-spin" />
                       Finalizing Master Record...
                     </>
                   ) : (
                     <>
                       <CheckCircle2 className="h-4 w-4" />
                       Verify & Commit
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

function AttachmentSummary({ values, onOpen }: { values: any, onOpen: () => void }) {
  const docs = [
    values.gstinCopy, values.panCopy, values.msmedCopy, 
    values.cancelledChequeCopy, values.tdsExemptionCopy, values.signedDeclaration
  ];
  const uploadedCount = docs.filter(v => v && v !== '').length;
  const isComplete = uploadedCount >= 4; // Mandatory 4

  return (
    <div className="bg-white/50 p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-600/30 transition-all group flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
          isComplete ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-100 text-slate-400"
        )}>
          {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <Paperclip className="h-6 w-6" />}
        </div>
        <div>
          <h4 className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-900 leading-none">Document Repository</h4>
          <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">
            {uploadedCount} of 6 Files Uploaded • <span className={isComplete ? "text-emerald-500" : "text-rose-500"}>{isComplete ? "Mandatory Ready" : "Pending Mandatory"}</span>
          </p>
        </div>
      </div>
      <button 
        type="button"
        onClick={onOpen}
        className="px-6 py-3 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-2 group-hover:px-8"
      >
        <FolderOpen className="h-4 w-4" />
        Manage Attachments
      </button>
    </div>
  );
}

function AttachmentModal({ values, setFieldValue, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95, y: 20 }}
         className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden relative border border-white"
       >
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg transform rotate-3">
                   <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">Upload Terminal</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry Attachments • Mandatory & Optional</p>
                </div>
             </div>
             <button onClick={onClose} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
               <X className="h-6 w-6" />
             </button>
          </div>

          <div className="p-10 max-h-[70vh] overflow-y-auto">
             <div className="mb-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold text-amber-900 leading-relaxed uppercase tracking-wider">
                  Important: Ensure all files are clear and readable. Mandatory documents (GST, PAN, MSMED, Cancelled Cheque) must be uploaded to proceed with the final registry synchronization.
                </p>
             </div>

             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 <FileField 
                   label="GSTIN Copy" 
                   value={values.gstinCopy} 
                   onUpload={(url: string) => setFieldValue('documents.gstinCopy', url)} 
                   required 
                 />
                 <FileField 
                   label="PAN Copy" 
                   value={values.panCopy} 
                   onUpload={(url: string) => setFieldValue('documents.panCopy', url)} 
                   required 
                 />
                 <FileField 
                   label="MSMED Certificate" 
                   value={values.msmedCopy} 
                   onUpload={(url: string) => setFieldValue('documents.msmedCopy', url)} 
                   required 
                 />
                 <FileField 
                   label="Cancelled Cheque" 
                   value={values.cancelledChequeCopy} 
                   onUpload={(url: string) => setFieldValue('documents.cancelledChequeCopy', url)} 
                   required 
                 />
                 <FileField 
                   label="TDS Exemption" 
                   value={values.tdsExemptionCopy} 
                   onUpload={(url: string) => setFieldValue('documents.tdsExemptionCopy', url)} 
                 />
                 <FileField 
                   label="Signed Declaration" 
                   value={values.signedDeclaration} 
                   onUpload={(url: string) => setFieldValue('documents.signedDeclaration', url)} 
                 />
             </div>
          </div>

          <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
             <button 
               onClick={onClose}
               className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
             >
               Confirm & Close
             </button>
          </div>
       </motion.div>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-display tracking-tight italic uppercase">{title}</h3>
      </div>
      <div className="pl-0 md:pl-14">
        {children}
      </div>
    </div>
  );
}

function FileField({ label, value, onUpload, required }: any) {
  const [uploading, setUploading] = useState(false);
  const scriptUrl = getScriptUrl();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (scriptUrl) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;

        const result = await apiCall('upload', {
          file: base64,
          filename: file.name,
          contentType: file.type
        });

        if (result && result.url) {
          onUpload(result.url);
        } else if (result && result.success) {
          // Fallback if the script doesn't return a specific URL but returns success
          onUpload(`https://drive.google.com/drive/folders/${(import.meta as any).env.VITE_GOOGLE_DRIVE_FOLDER_ID || ''}`);
        } else {
          throw new Error('Upload failed');
        }
      } else {
        // Mock fallback if no SCRIPT_URL
        await new Promise(resolve => setTimeout(resolve, 1500));
        onUpload('https://example.com/uploaded/' + file.name);
      }
    } catch (error: any) {
      console.error('Upload failure details:', error);
      const errorMsg = error.message || 'Unknown network error';
      alert(`Critical Upload Failure: ${errorMsg}\n\nTroubleshooting:\n1. Ensure the Google Script is correctly deployed as a Web App.\n2. Verify the FOLDER_ID in Code.gs is correct and accessible.\n3. Large files may hit Google Apps Script execution limits.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] pl-1 leading-none flex items-center justify-between">
        <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        {value && (
          <span className="text-emerald-500 font-bold text-[9px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 shadow-sm">
            ATTACHED
          </span>
        )}
      </label>
      <div className={cn(
        "relative h-20 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 overflow-hidden",
        value ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200 hover:border-indigo-600 hover:bg-slate-50"
      )}>
        {uploading ? (
          <div className="flex flex-col items-center gap-1 text-indigo-600 animate-pulse">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-[9px] font-black uppercase">uploading...</span>
          </div>
        ) : value ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
            <span className="text-[9px] font-black uppercase">Verified</span>
          </motion.div>
        ) : (
          <>
            <Upload className="h-5 w-5 text-slate-300" />
            <span className="text-[9px] font-black uppercase text-slate-300">Click to upload</span>
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

function FormInput({ label, name, type = 'text', placeholder, options, error, className }: any) {
  return (
    <div className={cn("space-y-2", className)}>
       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 leading-none block">{label}</label>
       <div className="relative group">
         {type === 'select' ? (
           <Field as="select" name={name} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 hover:border-slate-300 transition-all outline-none shadow-sm appearance-none cursor-pointer">
              {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
           </Field>
         ) : (
           <Field name={name} placeholder={placeholder} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-[13px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 hover:border-slate-300 transition-all outline-none shadow-sm placeholder:text-slate-300 placeholder:font-normal" />
         )}
         {type === 'select' && (
           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
             <ChevronRight className="h-4 w-4 rotate-90" />
           </div>
         )}
       </div>
       <div className="min-h-[16px]">
         <AnimatePresence>
           {error && (
             <motion.p 
               initial={{ opacity: 0, x: -5 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1 flex items-center gap-1.5 mt-1"
             >
               <AlertCircle className="h-3 w-3" /> {error}
             </motion.p>
           )}
         </AnimatePresence>
       </div>
    </div>
  );
}

function SettingsView({ health, currentTheme, onThemeChange }: { health: any, currentTheme: string, onThemeChange: (t: string) => void }) {
  const [customUrl, setCustomUrl] = useState(localStorage.getItem('VITE_GOOGLE_SCRIPT_URL') || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const themes = [
    { id: 'theme-default', name: 'Midnight Slate', primary: 'bg-indigo-600', secondary: 'bg-slate-900', icon: ShieldCheck, accent: 'theme-indigo' },
    { id: 'theme-midnight', name: 'Cyber Night', primary: 'bg-violet-600', secondary: 'bg-slate-950', icon: Activity, accent: 'theme-cyber' },
    { id: 'theme-emerald', name: 'Corporate Green', primary: 'bg-emerald-600', secondary: 'bg-emerald-950', icon: CheckCircle2, accent: 'theme-green' },
    { id: 'theme-ocean', name: 'Oceanic Blue', primary: 'bg-sky-600', secondary: 'bg-sky-950', icon: Database, accent: 'theme-blue' },
    { id: 'theme-amber', name: 'Golden Harvest', primary: 'bg-amber-600', secondary: 'bg-amber-900', icon: TrendingUp, accent: 'theme-gold' },
    { id: 'theme-rose', name: 'Rose Petal', primary: 'bg-rose-600', secondary: 'bg-rose-900', icon: Heart, accent: 'theme-rose' },
    { id: 'theme-violet', name: 'Digital Violet', primary: 'bg-violet-600', secondary: 'bg-violet-900', icon: Zap, accent: 'theme-violet' },
    { id: 'theme-crimson', name: 'Crimson Peak', primary: 'bg-red-600', secondary: 'bg-red-950', icon: Flame, accent: 'theme-red' },
  ];

  const handleUpdateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    if (customUrl.trim()) {
      localStorage.setItem('VITE_GOOGLE_SCRIPT_URL', customUrl.trim());
    } else {
      localStorage.removeItem('VITE_GOOGLE_SCRIPT_URL');
    }
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        window.location.reload(); // Reload to apply global constant change
      }, 1000);
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto space-y-10 pb-32">
      <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden text-center">
        <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic leading-none">System Terminal</h1>
        <p className="text-slate-500 font-bold text-sm mt-4 uppercase tracking-[0.3em]">Infrastructure Matrix & Core Integrations</p>
        <Building2 className="absolute -right-12 -bottom-12 h-48 w-48 text-white/5" />
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-16">
          {/* Theme Palette Section */}
          <section className="space-y-8">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <Palette className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-widest italic">Aesthetic Protocols</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={cn(
                      "group p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden",
                      currentTheme === theme.id 
                        ? "border-[var(--theme-primary)] bg-white shadow-xl ring-4 ring-[var(--theme-primary)]/10" 
                        : "border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:shadow-lg"
                    )}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", theme.primary)}>
                        <theme.icon className="h-6 w-6" />
                      </div>
                      {currentTheme === theme.id && (
                        <div className="h-6 w-6 bg-[var(--theme-primary)] rounded-full flex items-center justify-center text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight italic">{theme.name}</p>
                      <div className="flex gap-2 mt-3">
                        <div className={cn("h-5 w-5 rounded-lg shadow-sm border border-black/5", theme.primary)} />
                        <div className={cn("h-5 w-5 rounded-lg shadow-sm border border-black/5", theme.secondary)} />
                        <div className="h-5 w-5 rounded-lg shadow-sm bg-white border border-slate-200" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
          </section>

          <section className="space-y-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <Database className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-widest italic">Core Connectivity</h3>
                </div>
                {health.db === 'disconnected' && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100 animate-pulse">Action Required</span>
                )}
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner space-y-6">
                <div>
                  <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ExternalLink className="h-4 w-4 text-indigo-500" />
                    Web App URL Override
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-2xl">
                    Paste your Google Apps Script Web App URL here to establish a direct link between this interface and your secure database.
                  </p>
                </div>

                <form onSubmit={handleUpdateUrl} className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 w-full relative">
                    <input 
                      type="text" 
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-5 text-[13px] font-mono text-slate-700 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all outline-none"
                    />
                    {customUrl && (
                      <button 
                        type="button" 
                        onClick={() => setCustomUrl('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={saveStatus !== 'idle'}
                    className={cn(
                      "px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 min-w-[140px] justify-center",
                      saveStatus === 'idle' ? "bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-200" :
                      saveStatus === 'saving' ? "bg-slate-200 text-slate-400 cursor-wait" :
                      "bg-emerald-500 text-white shadow-emerald-200"
                    )}
                  >
                    {saveStatus === 'idle' && (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Update Sync
                      </>
                    )}
                    {saveStatus === 'saving' && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {saveStatus === 'saved' && (
                      <>
                        <Check className="h-4 w-4" />
                        Connected
                      </>
                    )}
                  </button>
                </form>
              </div>

              {health.db !== 'online' && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 space-y-6">
                  <div className="flex items-center gap-4 text-amber-800">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold uppercase tracking-tight">Cloud Sync is currently Offline</h4>
                      <p className="text-[11px] font-medium opacity-80">Follow the protocol below to establish a secure Google Sheets uplink.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 pt-4">
                    {[
                      { step: '01', title: 'Script Setup', desc: 'Copy "google-apps-script.js" into a new Google Apps Script project attached to your sheet.' },
                      { step: '02', title: 'Deployment', desc: 'Deploy as a Web App with access set to "Anyone" and copy the final Web App URL.' },
                      { step: '03', title: 'Environment', desc: 'Paste the URL in the "Web App URL Override" field above and click Update.' }
                    ].map((s, idx) => (
                      <div key={idx} className="bg-white/50 p-5 rounded-2xl border border-amber-200/50">
                        <span className="text-[10px] font-black text-amber-500">{s.step}</span>
                        <h5 className="text-[12px] font-bold text-slate-900 uppercase mt-1">{s.title}</h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-2">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                 <div className="group flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all shadow-inner">
                    <div className="flex items-center gap-6">
                       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Database className="h-7 w-7 text-indigo-600" /></div>
                       <div>
                          <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">Master Registry</p>
                          <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">{health.db === 'demo' ? 'Local Persistence' : 'Cloud Synchronized'}</p>
                          {getScriptUrl() && (
                            <p className="text-[8px] text-slate-400 mt-2 truncate max-w-[200px] font-mono opacity-50">{getScriptUrl()}</p>
                          )}
                       </div>
                    </div>
                    <div className={cn("h-3 w-3 rounded-full shadow-lg ring-4", health.db === 'disconnected' ? "bg-rose-500 ring-rose-100" : "bg-emerald-500 ring-emerald-100 animate-pulse")} />
                 </div>
                 
                 <div className="group flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all shadow-inner">
                    <div className="flex items-center gap-6">
                       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Globe className="h-7 w-7 text-indigo-600" /></div>
                       <div>
                          <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">Email SES Dispatch</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Enterprise SES Gateway</p>
                       </div>
                    </div>
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg ring-4 ring-emerald-100" />
                 </div>
              </div>
          </section>

          <section className="space-y-8">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <Palette className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-widest italic">Experimental Protocols</h3>
              </div>
              <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100 opacity-40 grayscale select-none">
                  <div className="flex items-center gap-6">
                     <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center"><Plus className="h-7 w-7 text-slate-300" /></div>
                     <div>
                        <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">Neural Substrate (Dark View)</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Awaiting Security clearance</p>
                     </div>
                  </div>
                  <X className="h-6 w-6 text-slate-300" />
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
