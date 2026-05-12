import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DUMMY_VENDORS } from './dummyData';
import axios from 'axios';
import type { Vendor } from './types/vendor';

const SCRIPT_URL = (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL;

export const loadVendors = createAsyncThunk('vendors/fetchAll', async () => {
  const isStaticHost = window.location.hostname.includes('github.io') || window.location.hostname.includes('web.app') || window.location.hostname.includes('pages.dev');
  
  try {
    // Priority: Google Script URL for Sheet Database
    if (SCRIPT_URL) {
      const res = await axios.get(`${SCRIPT_URL}?action=list`);
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && data.vendors && Array.isArray(data.vendors)) return data.vendors;
      if (data && data.data && Array.isArray(data.data)) return data.data;
    }

    // On static hosts without script URL, skip backend call
    if (isStaticHost && !SCRIPT_URL) {
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
    if (isGithubPages || (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405))) {
      console.warn('Synchronous server not found, falling back to client-side persistence');
      const stored = localStorage.getItem('vendor_registry');
      return stored ? JSON.parse(stored) : DUMMY_VENDORS;
    }
    console.error('Fetch error in store:', error);
    return DUMMY_VENDORS;
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
