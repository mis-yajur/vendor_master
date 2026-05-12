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
    <div className="min-h-screen bg-[#F8F9FD]">
      {/* Top Header */}
      <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-8 md:px-16 sticky top-0 z-40 shadow-sm">
         <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Materially<span className="text-indigo-600">Pro</span>
              </span>
            </Link>

            <nav className="hidden xl:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                    location.pathname === item.path 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
         </div>

         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 mr-6">
               <div className="flex items-center gap-2">
                 <div className={cn("h-2 w-2 rounded-full", systemHealth.db !== 'disconnected' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{systemHealth.db !== 'disconnected' ? 'Active' : 'Offline'}</span>
               </div>
               <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors relative">
                 <Bell className="h-5 w-5" />
                 <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
               </button>
            </div>
            
            <div className="h-10 w-px bg-slate-100 hidden sm:block" />
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-none">Prosun Majhi</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Admin</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-slate-100 border-4 border border-white shadow-sm overflow-hidden flex items-center justify-center">
                <User className="h-7 w-7 text-slate-400" />
              </div>
            </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto p-4 md:p-12">
         {children}
      </main>

      {/* Mobile Nav */}
      <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-[2rem] px-4 py-3 flex items-center gap-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-3 rounded-2xl transition-all",
              location.pathname === item.path ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
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
