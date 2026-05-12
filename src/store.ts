import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DUMMY_VENDORS } from './dummyData';
import axios from 'axios';
import type { Vendor } from './types/vendor';

const getScriptUrl = () => {
  const custom = localStorage.getItem('VITE_GOOGLE_SCRIPT_URL');
  if (custom) return custom;
  return (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbytYZ_AO4hrLTTi7yz5mVfLn4ahTyA-viPld4tb7ghTNmaLz_9vgh0Mhzy2YXUC3xcPYw/exec";
};

export const loadVendors = createAsyncThunk('vendors/fetchAll', async () => {
  const scriptUrl = getScriptUrl();
  const isStaticHost = window.location.hostname.includes('github.io') || 
                       window.location.hostname.includes('web.app') || 
                       window.location.hostname.includes('pages.dev') ||
                       window.location.hostname.includes('run.app') ||
                       window.location.hostname.includes('localhost');
  
  try {
    // Priority: Google Script URL for Sheet Database
    if (scriptUrl) {
      const res = await axios.get(`${scriptUrl}?action=list`);
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && data.vendors && Array.isArray(data.vendors)) return data.vendors;
      if (data && data.data && Array.isArray(data.data)) return data.data;
    }

    // On static hosts without script URL, skip backend call
    if (isStaticHost && !scriptUrl) {
      const stored = localStorage.getItem('vendor_registry');
      return stored ? JSON.parse(stored) : DUMMY_VENDORS;
    }

    const res = await axios.get('/api/vendors');
    const data = res.data;
    
    // Handle cases where the API might return an object with a data property
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (Array.isArray(data.vendors)) return data.vendors;
      if (Array.isArray(data.data)) return data.data;
    }
    return Array.isArray(data) ? data : DUMMY_VENDORS;
  } catch (error) {
    if (isStaticHost || (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405))) {
      console.warn('Synchronous server not found, falling back to client-side persistence');
      const stored = localStorage.getItem('vendor_registry');
      return stored ? JSON.parse(stored) : DUMMY_VENDORS;
    }
    console.error('Fetch error in store:', error);
    return DUMMY_VENDORS;
  }
});

export const deleteVendor = createAsyncThunk('vendors/delete', async (id: string, { rejectWithValue }) => {
  const scriptUrl = getScriptUrl();
  try {
    if (scriptUrl) {
      await axios.post(scriptUrl, JSON.stringify({ action: 'delete', id }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
    }
    const stored = localStorage.getItem('vendor_registry');
    if (stored) {
      const current = JSON.parse(stored);
      const updated = current.filter((v: any) => v.id !== id);
      localStorage.setItem('vendor_registry', JSON.stringify(updated));
    }
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const updateVendor = createAsyncThunk('vendors/update', async (vendor: Vendor, { rejectWithValue }) => {
  const scriptUrl = getScriptUrl();
  try {
    if (scriptUrl) {
      await axios.post(scriptUrl, JSON.stringify({ action: 'update', vendor }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
    }
    const stored = localStorage.getItem('vendor_registry');
    if (stored) {
      const current = JSON.parse(stored);
      const updated = current.map((v: any) => v.id === vendor.id ? vendor : v);
      localStorage.setItem('vendor_registry', JSON.stringify(updated));
    }
    return vendor;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const addBulkVendors = createAsyncThunk('vendors/bulkAdd', async (vendors: Vendor[], { rejectWithValue }) => {
  const scriptUrl = getScriptUrl();
  try {
    if (scriptUrl) {
      await axios.post(scriptUrl, JSON.stringify({ action: 'bulkAdd', vendors }), {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
    }
    const stored = localStorage.getItem('vendor_registry');
    const current = stored ? JSON.parse(stored) : DUMMY_VENDORS;
    const updated = [...vendors, ...current];
    localStorage.setItem('vendor_registry', JSON.stringify(updated));
    return vendors;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const vendorSlice = createSlice({
  name: 'vendors',
  initialState: {
    items: DUMMY_VENDORS as Vendor[],
    loading: false,
    error: null as string | null,
    systemHealth: { status: 'demo', db: 'demo' },
  },
  reducers: {
    setHealth: (state, action) => {
      state.systemHealth = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : DUMMY_VENDORS;
      })
      .addCase(loadVendors.rejected, (state) => {
        state.loading = false;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.items = state.items.filter(v => v.id !== action.payload);
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.items = state.items.map(v => v.id === action.payload.id ? action.payload : v);
      })
      .addCase(addBulkVendors.fulfilled, (state, action) => {
        state.items = [...action.payload, ...state.items];
      });
  },
});

export const { setHealth } = vendorSlice.actions;

export const store = configureStore({
  reducer: {
    vendors: vendorSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
