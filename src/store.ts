import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DUMMY_VENDORS } from './dummyData';
import axios from 'axios';

const SCRIPT_URL = (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL;

export const loadVendors = createAsyncThunk('vendors/fetchAll', async () => {
  try {
    const isDirect = window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost');
    let data;
    if (isDirect && SCRIPT_URL) {
      const resp = await axios.get(`${SCRIPT_URL}?action=list`);
      data = resp.data;
    } else {
      const res = await axios.get('/api/vendors');
      data = res.data;
    }
    // Handle cases where the API might return an object with a data property
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (Array.isArray(data.vendors)) return data.vendors;
      if (Array.isArray(data.data)) return data.data;
    }
    return Array.isArray(data) ? data : DUMMY_VENDORS;
  } catch (error) {
    console.error('Fetch error:', error);
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
