/**
 * NITTE Merchandise Shop API Client
 * JavaScript/Node.js SDK for consuming the API
 */

import axios from 'axios';

class NitteMerchClient {
  constructor(baseURL = 'http://localhost:3000', timeout = 30000) {
    this.baseURL = baseURL;
    this.accessToken = null;
    this.refreshToken = null;

    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor for handling token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // =====================
  // Authentication Methods
  // =====================

  async signup(email, password, name) {
    try {
      const response = await this.client.post('/auth/signup', {
        email,
        password,
        name,
      });
      this.accessToken = response.data.tokens.access_token;
      this.refreshToken = response.data.tokens.refresh_token;
      return response.data.data;
    } catch (error) {
      throw new Error(`Signup failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', {
        email,
        password,
      });
      this.accessToken = response.data.tokens.access_token;
      this.refreshToken = response.data.tokens.refresh_token;
      return response.data.data;
    } catch (error) {
      throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    try {
      const response = await this.client.post('/auth/refresh', {
        refresh_token: this.refreshToken,
      });
      this.accessToken = response.data.tokens.access_token;
      return this.accessToken;
    } catch (error) {
      this.accessToken = null;
      this.refreshToken = null;
      throw new Error(`Token refresh failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.client.get('/auth/me');
      return response.data.data;
    } catch (error) {
      throw new Error(`Get user failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // =====================
  // Product Methods
  // =====================

  async getProducts(category = null, skip = 0, limit = 50) {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('skip', skip);
      params.append('limit', limit);

      const response = await this.client.get(`/products?${params.toString()}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(`Get products failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getProductById(productId) {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Get product failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      const response = await this.client.post('/products', productData);
      return response.data.data;
    } catch (error) {
      throw new Error(`Create product failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateProduct(productId, productData) {
    try {
      const response = await this.client.put(`/products/${productId}`, productData);
      return response.data.data;
    } catch (error) {
      throw new Error(`Update product failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteProduct(productId) {
    try {
      await this.client.delete(`/products/${productId}`);
      return { success: true };
    } catch (error) {
      throw new Error(`Delete product failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // =====================
  // Order Methods
  // =====================

  async getOrders() {
    try {
      const response = await this.client.get('/orders');
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(`Get orders failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Get order failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async createOrder(items, shippingAddress, notes = '') {
    try {
      const response = await this.client.post('/orders', {
        items,
        shipping_address: shippingAddress,
        notes,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Create order failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateOrder(orderId, status, notes = '') {
    try {
      const response = await this.client.put(`/orders/${orderId}`, {
        status,
        notes,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Update order failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // =====================
  // Health Check Methods
  // =====================

  async getHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/api/health`);
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async getServiceHealth() {
    try {
      const response = await this.client.get('/service-health');
      return response.data;
    } catch (error) {
      throw new Error(`Service health check failed: ${error.message}`);
    }
  }
}

// Export for CommonJS and ES modules
export default NitteMerchClient;
