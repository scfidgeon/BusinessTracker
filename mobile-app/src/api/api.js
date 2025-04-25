import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// When testing with Expo Go on a real device, 
// we'll need to use the local IP of the computer running the backend
// For simulator/emulator, use localhost
const API_URL = 'https://onsight.replit.app/api';

// Function to safely store auth token
export async function storeAuthToken(token) {
  try {
    await SecureStore.setItemAsync('auth_token', token);
    return true;
  } catch (error) {
    console.error('Error storing auth token:', error);
    return false;
  }
}

// Function to retrieve auth token
export async function getAuthToken() {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    return token;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
}

// Function to clear auth token on logout
export async function clearAuthToken() {
  try {
    await SecureStore.deleteItemAsync('auth_token');
    return true;
  } catch (error) {
    console.error('Error clearing auth token:', error);
    return false;
  }
}

// Function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const options = {
    method,
    headers,
    credentials: 'include',
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    // For successful response, parse and return JSON
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { success: true };
    }
    
    // Handle error responses
    const errorData = await response.json().catch(() => ({
      message: response.statusText || 'Unknown error'
    }));
    
    throw new Error(errorData.message || 'Request failed');
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    throw error;
  }
}

// Auth API calls
export const authAPI = {
  login: (username, password) => {
    return apiRequest('/login', 'POST', { username, password });
  },
  
  register: (userData) => {
    return apiRequest('/register', 'POST', userData);
  },
  
  logout: () => {
    return apiRequest('/logout', 'POST');
  },
  
  getCurrentUser: () => {
    return apiRequest('/me');
  }
};

// Clients API calls
export const clientsAPI = {
  getClients: () => {
    return apiRequest('/clients');
  },
  
  getClient: (id) => {
    return apiRequest(`/clients/${id}`);
  },
  
  createClient: (clientData) => {
    return apiRequest('/clients', 'POST', clientData);
  },
  
  updateClient: (id, clientData) => {
    return apiRequest(`/clients/${id}`, 'PUT', clientData);
  },
  
  deleteClient: (id) => {
    return apiRequest(`/clients/${id}`, 'DELETE');
  }
};

// Visits API calls
export const visitsAPI = {
  getVisits: (dateOrClientId) => {
    let endpoint = '/visits';
    if (dateOrClientId) {
      if (typeof dateOrClientId === 'number') {
        endpoint += `?clientId=${dateOrClientId}`;
      } else {
        endpoint += `?date=${dateOrClientId}`;
      }
    }
    return apiRequest(endpoint);
  },
  
  getCurrentVisit: () => {
    return apiRequest('/visits/current');
  },
  
  startVisit: (visitData) => {
    return apiRequest('/visits/start', 'POST', visitData);
  },
  
  endVisit: (id) => {
    return apiRequest(`/visits/${id}/end`, 'POST');
  },
  
  getUninvoicedVisits: () => {
    return apiRequest('/visits/uninvoiced');
  }
};

// Invoices API calls
export const invoicesAPI = {
  getInvoices: (clientId) => {
    let endpoint = '/invoices';
    if (clientId) {
      endpoint += `?clientId=${clientId}`;
    }
    return apiRequest(endpoint);
  },
  
  getInvoice: (id) => {
    return apiRequest(`/invoices/${id}`);
  },
  
  createInvoice: (invoiceData) => {
    return apiRequest('/invoices', 'POST', invoiceData);
  },
  
  updateInvoice: (id, invoiceData) => {
    return apiRequest(`/invoices/${id}`, 'PUT', invoiceData);
  }
};