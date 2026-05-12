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
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vendors', label: 'Vendor Registry', icon: Users },
    { path: '/register', label: 'New Onboarding', icon: Plus },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transition-transform duration-300 lg:translate-x-0 lg:static",
        !isSidebarOpen && "-translate-x-full lg:w-20"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex h-20 items-center px-6 border-b border-slate-50 gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
              <Building2 className="h-6 w-6" />
            </div>
            {isSidebarOpen && (
              <span className="text-lg font-black tracking-tight text-slate-900">
                Materially<span className="text-indigo-600">Pro</span>
              </span>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  location.pathname === item.path 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-5 w-5", location.pathname === item.path ? "text-indigo-600" : "text-slate-400")} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-50">
            <div className="p-4 bg-indigo-600 rounded-[2rem] text-white overflow-hidden relative group">
              <div className="relative z-10">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Support</p>
                <p className="text-sm font-black mt-1">Need help with onboarding?</p>
                <button className="mt-4 w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors">Contact MIS</button>
              </div>
              <Activity className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500">
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Universal Search..." 
                  className="bg-slate-50 border-transparent pl-10 pr-4 py-2 rounded-xl text-xs font-bold w-64 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", systemHealth.db !== 'disconnected' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{systemHealth.db !== 'disconnected' ? 'Active' : 'Offline'}</span>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>
              <div className="h-8 w-px bg-slate-100 mx-2" />
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-none">Prosun Majhi</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Admin</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
              </div>
           </div>
        </header>

        <main className="p-8">
           {children}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ vendors = [], health, onRefresh }: any) {
  const vendorsArray = Array.isArray(vendors) ? vendors : [];
  
  const areaChartOptions: any = {
    chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 4 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#94A3B8', fontWeight: 600 } }
    },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    colors: ['#FFFFFF'],
  };

  const areaChartSeries = [{
    name: 'Sales',
    data: [31, 40, 28, 51, 42, 60]
  }];

  const donutOptions: any = {
    chart: { type: 'donut' },
    labels: ['YouTube', 'Facebook', 'Twitter'],
    colors: ['#F44336', '#2196F3', '#00BCD4'],
    legend: { position: 'bottom', markers: { radius: 12 } },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => '2'
            }
          }
        }
      }
    },
    dataLabels: { enabled: false }
  };

  const donutSeries = [40, 40, 20];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="All Earnings" value="$30,200" icon={CircleDollarSign} trend="10% changes on profit" color="amber" />
        <StatCard title="Task" value="145" icon={Calendar} trend="28% task performance" color="rose" />
        <StatCard title="Page Views" value="290+" icon={FileText} trend="10k daily views" color="emerald" />
        <StatCard title="Downloads" value="500" icon={ThumbsUp} trend="1k download in App store" color="indigo" />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 bg-[#2C5EFF] rounded-xl p-0 overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold opacity-80">Sales Per Day</h3>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3" />
                <span>3%</span>
              </div>
            </div>
            <div className="h-[200px] -mx-4 -mb-4">
              <Chart options={areaChartOptions} series={areaChartSeries} type="area" height="100%" />
            </div>
          </div>
          <div className="bg-white p-6 grid grid-cols-2 gap-4 border-t border-slate-100 flex-1">
             <div>
                <p className="text-2xl font-black text-slate-900">$4230</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Revenue</p>
             </div>
             <div>
                <p className="text-2xl font-black text-slate-900">321</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Today Sales</p>
             </div>
             <div className="col-span-1 pt-4 border-t border-slate-50">
               <p className="text-xs font-bold text-slate-400">REALTY</p>
               <p className="text-lg font-black text-rose-500">-0.99</p>
             </div>
             <div className="col-span-1 pt-4 border-t border-slate-50">
               <p className="text-xs font-bold text-slate-400">INFRA</p>
               <p className="text-lg font-black text-emerald-500">-7.66</p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-8 pb-4 border-b">Total Revenue</h3>
          <div className="h-[250px] flex items-center justify-center">
            <Chart options={donutOptions} series={donutSeries} type="donut" height="100%" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-8 py-4 border-t">
             <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400">Youtube</p>
                <p className="text-sm font-bold text-indigo-600">+16.85%</p>
             </div>
             <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400">Facebook</p>
                <p className="text-sm font-bold text-emerald-600">+45.36%</p>
             </div>
             <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400">Twitter</p>
                <p className="text-sm font-bold text-amber-600">-50.69%</p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900 mb-8 pb-4 border-b">Traffic Sources</h3>
          <div className="space-y-6">
             <TrafficItem label="Direct" value={80} color="bg-[#4069FF]" />
             <TrafficItem label="Social" value={50} color="bg-slate-400" />
             <TrafficItem label="Referral" value={20} color="bg-[#4069FF]" />
             <TrafficItem label="Bounce" value={60} color="bg-slate-400" />
             <TrafficItem label="Internet" value={40} color="bg-[#4069FF]" />
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const vendorsArray = Array.isArray(vendors) ? vendors : [];

  const filteredVendors = vendorsArray.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.statutory.gstin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vendor Registry</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage and monitor all onboarded business partners.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
             <Download className="h-4 w-4" /> Export CSV
           </button>
           <Link to="/register" className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
             <Plus className="h-4 w-4" /> Add Vendor
           </Link>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by legal name, GSTIN, PAN or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 hover:border-indigo-200 transition-all outline-none shadow-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} onSelect={() => setSelectedVendor(vendor)} />
        ))}
        {!loading && filteredVendors.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
            <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No registered vendors found matching your query.</p>
          </div>
        )}
      </div>

      {selectedVendor && <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />}
    </motion.div>
  );
}

function VendorCard({ vendor, onSelect }: { vendor: Vendor, onSelect: () => void }) {
  return (
    <div className="group bg-white rounded-[2rem] border border-slate-50 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-110 transition-transform">
          {vendor.name.charAt(0)}
        </div>
        <div className="text-right">
           <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">{vendor.requestType}</span>
           <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-widest">{vendor.statutory.vendorType}</p>
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{vendor.name}</h3>
      <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-400">
         <MapPin className="h-3 w-3" />
         <span>{vendor.address.city}, {vendor.address.state}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
         <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">GSTIN</p>
            <p className="text-xs font-bold text-slate-700 truncate uppercase">{vendor.statutory.gstin}</p>
         </div>
         <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">PAN</p>
            <p className="text-xs font-bold text-slate-700 truncate uppercase">{vendor.statutory.pan}</p>
         </div>
      </div>

      <button onClick={onSelect} className="mt-8 w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">View Full Profile</button>
    </div>
  );
}

function VendorDetailModal({ vendor, onClose }: { vendor: Vendor, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden relative my-8">
        <div className="sticky top-0 bg-white z-10 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Building2 className="h-7 w-7" /></div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{vendor.name}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System ID: {vendor.id} • Registered {formatDate(vendor.createdAt)}</p>
               </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-10 grid gap-10 lg:grid-cols-3 max-h-[70vh] overflow-y-auto bg-[#F8F9FD]">
           <ProfileSection title="Address" icon={MapPin}>
              <ProfileItem label="Street" value={vendor.address.street} />
              <ProfileItem label="Location" value={`${vendor.address.city}, ${vendor.address.state}`} />
              <ProfileItem label="Pin Code" value={vendor.address.pinCode} />
              <ProfileItem label="Mobile" value={vendor.address.mobile} />
              <ProfileItem label="Email" value={vendor.address.email} />
           </ProfileSection>

           <ProfileSection title="Statutory" icon={ShieldCheck}>
              <ProfileItem label="GSTIN" value={vendor.statutory.gstin} highlighted />
              <ProfileItem label="PAN" value={vendor.statutory.pan} highlighted />
              <ProfileItem label="Business Type" value={vendor.statutory.constitution} />
              <ProfileItem label="Vendor Type" value={vendor.statutory.vendorType} />
           </ProfileSection>

           <ProfileSection title="Banking" icon={CreditCard}>
              <ProfileItem label="Account Name" value={vendor.bank.beneficiaryName} />
              <ProfileItem label="Bank" value={vendor.bank.bankName} />
              <ProfileItem label="A/C No" value={vendor.bank.accountNumber} highlighted />
              <ProfileItem label="IFSC Code" value={vendor.bank.ifscCode} highlighted />
           </ProfileSection>

           <ProfileSection title="Attachments" icon={Plus} className="lg:col-span-3">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                 <DocLink label="GSTIN Copy" url={vendor.documents.gstinCopy} />
                 <DocLink label="PAN Copy" url={vendor.documents.panCopy} />
                 <DocLink label="Cancelled Cheque" url={vendor.documents.cancelledChequeCopy} />
                 <DocLink label="Declaration" url={vendor.documents.signedDeclaration} />
              </div>
           </ProfileSection>
        </div>

        <div className="px-10 py-8 border-t border-slate-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-8 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">Close Profile</button>
           <button className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Download Dossier</button>
        </div>
      </motion.div>
    </div>
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

function DocLink({ label, url }: any) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-600">{label}</span>
       <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-indigo-600" />
    </a>
  );
}

const REGISTRATION_SCHEMA = Yup.object().shape({
  name: Yup.string().required('Legal name is required'),
  requestType: Yup.string().oneOf(['New', 'Change']).required(),
  address: Yup.object().shape({
    city: Yup.string().required('Required'),
    state: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
  }),
  statutory: Yup.object().shape({
    pan: Yup.string().required('Required'),
    gstin: Yup.string().required('Required'),
  }),
  bank: Yup.object().shape({
    bankName: Yup.string().required('Required'),
    accountNumber: Yup.string().required('Required'),
    ifscCode: Yup.string().required('Required'),
  })
});

function RegistrationForm({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Onboarding Request</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Please fill in the legal and financial details of the vendor.</p>
      </div>

      <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl">
        <Formik
          initialValues={{
            requestType: 'New',
            name: '',
            address: { city: '', state: '', email: '', mobile: '', pinCode: '', street: '' },
            statutory: { vendorType: 'Goods', constitution: 'Private Limited', pan: '', gstin: '' },
            bank: { beneficiaryName: '', bankName: '', accountNumber: '', ifscCode: '' },
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
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Business Identity</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormInput label="Official Legal Name" name="name" placeholder="E.g. Acme Corp Pvt Ltd" error={touched.name && errors.name} />
                  <FormInput label="Request Action" name="requestType" type="select" options={['New', 'Change']} />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><MapPin className="h-4 w-4" /></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Location & Contact</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                   <FormInput label="Street" name="address.street" placeholder="Address line 1" />
                   <FormInput label="City" name="address.city" placeholder="E.g. Mumbai" error={touched.address?.city && (errors as any).address?.city} />
                   <FormInput label="State" name="address.state" placeholder="E.g. Maharashtra" error={touched.address?.state && (errors as any).address?.state} />
                   <FormInput label="Contact E-Mail" name="address.email" placeholder="legal@vendor.com" error={touched.address?.email && (errors as any).address?.email} />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><ShieldCheck className="h-4 w-4" /></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tax & Statutory</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                   <FormInput label="Income Tax PAN" name="statutory.pan" placeholder="10 Digit PAN" error={touched.statutory?.pan && (errors as any).statutory?.pan} />
                   <FormInput label="GSTIN Number" name="statutory.gstin" placeholder="15 Digit GSTIN" error={touched.statutory?.gstin && (errors as any).statutory?.gstin} />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><CreditCard className="h-4 w-4" /></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Financial Disbursement</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                   <FormInput label="Bank Name" name="bank.bankName" placeholder="E.g. HDFC Bank" error={touched.bank?.bankName && (errors as any).bank?.bankName} />
                   <FormInput label="Account Number" name="bank.accountNumber" placeholder="Full A/C Number" error={touched.bank?.accountNumber && (errors as any).bank?.accountNumber} />
                   <FormInput label="IFSC Code" name="bank.ifscCode" placeholder="Branch IFSC Code" error={touched.bank?.ifscCode && (errors as any).bank?.ifscCode} />
                   <FormInput label="Beneficiary Name" name="bank.beneficiaryName" placeholder="Name as per Passbook" />
                </div>
              </section>

              <div className="pt-10 flex items-center justify-center gap-4 border-t border-slate-50">
                 <button type="button" onClick={() => navigate('/vendors')} className="px-10 py-4 bg-slate-50 text-slate-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl active:scale-95 transition-all flex items-center gap-2">
                   {isSubmitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
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
