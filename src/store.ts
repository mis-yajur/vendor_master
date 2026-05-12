import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DUMMY_VENDORS } from './dummyData';
import axios from 'axios';

const SCRIPT_URL = (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL;

export const fetchVendors = createAsyncThunk('vendors/fetchAll', async () => {
  try {
    const isDirect = window.location.hostname.includes('github.io') || window.location.hostname.includes('localhost');
    if (isDirect && SCRIPT_URL) {
      const resp = await fetch(`${SCRIPT_URL}?action=list`);
      return resp.json();
    }
    const res = await axios.get('/api/vendors');
    return res.data;
  } catch (error) {
    return DUMMY_VENDORS;
  }
});

const vendorSlice = createSlice({
  name: 'vendors',
  initialState: {
    items: DUMMY_VENDORS,
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
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVendors.rejected, (state) => {
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
