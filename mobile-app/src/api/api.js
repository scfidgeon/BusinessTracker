import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Set the base URL for API requests
// When deployed, update this to your Replit deployment URL
const API_URL = 'https://onsight.replit.app/api';

// Create a token storage system using SecureStore
export async function storeAuthToken(token) {
  await SecureStore.setItemAsync('auth_token', token);
}

export async function getAuthToken() {
  return await SecureStore.getItemAsync('auth_token');
}

export async function clearAuthToken() {
  await SecureStore.deleteItemAsync('auth_token');
}

// Create axios instance with interceptors for token handling
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Generic API request function
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const response = await apiClient({
      url: endpoint,
      method,
      data,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with an error status
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened while setting up the request
      throw new Error('Error setting up request');
    }
  }
}

// Authentication API methods
export const authAPI = {
  login: async (credentials) => {
    const data = await apiRequest('/login', 'POST', credentials);
    if (data.token) {
      await storeAuthToken(data.token);
    }
    return data;
  },
  
  register: async (userData) => {
    const data = await apiRequest('/register', 'POST', userData);
    if (data.token) {
      await storeAuthToken(data.token);
    }
    return data;
  },
  
  logout: async () => {
    await apiRequest('/logout', 'POST');
    await clearAuthToken();
  },
  
  getCurrentUser: async () => {
    return await apiRequest('/me', 'GET');
  },
};

// Clients API methods
export const clientsAPI = {
  getClients: async () => {
    return await apiRequest('/clients', 'GET');
  },
  
  getClient: async (clientId) => {
    return await apiRequest(`/clients/${clientId}`, 'GET');
  },
  
  createClient: async (clientData) => {
    return await apiRequest('/clients', 'POST', clientData);
  },
  
  updateClient: async (clientId, clientData) => {
    return await apiRequest(`/clients/${clientId}`, 'PUT', clientData);
  },
  
  deleteClient: async (clientId) => {
    return await apiRequest(`/clients/${clientId}`, 'DELETE');
  },
};

// Visits API methods
export const visitsAPI = {
  getVisits: async (date) => {
    const params = date ? `?date=${date}` : '';
    return await apiRequest(`/visits${params}`, 'GET');
  },
  
  getCurrentVisit: async () => {
    return await apiRequest('/visits/current', 'GET');
  },
  
  startVisit: async (visitData) => {
    return await apiRequest('/visits/start', 'POST', visitData);
  },
  
  endVisit: async (visitId) => {
    return await apiRequest(`/visits/${visitId}/end`, 'POST');
  },
  
  getUninvoicedVisits: async () => {
    return await apiRequest('/visits/uninvoiced', 'GET');
  },
};

// Invoices API methods
export const invoicesAPI = {
  getInvoices: async () => {
    return await apiRequest('/invoices', 'GET');
  },
  
  getInvoice: async (invoiceId) => {
    return await apiRequest(`/invoices/${invoiceId}`, 'GET');
  },
  
  createInvoice: async (invoiceData) => {
    return await apiRequest('/invoices', 'POST', invoiceData);
  },
  
  updateInvoice: async (invoiceId, invoiceData) => {
    return await apiRequest(`/invoices/${invoiceId}`, 'PUT', invoiceData);
  },
};