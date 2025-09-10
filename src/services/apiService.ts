import axios, { AxiosInstance } from 'axios';
import { ContainerInfo } from '@/types';

class ApiService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'https://felicit.at/dockermanager/api',
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle auth errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token might be expired, clear it
          this.setToken(null);
          // You might want to redirect to login here
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async getContainers(): Promise<ContainerInfo[]> {
    try {
      const response = await this.axiosInstance.get('/containers');
      return response.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        state: item.state,
        status: item.status,
        ports: item.ports || [],
        created: item.created,
        tty: item.tty,
        openStdin: item.openStdin,
      }));
    } catch (error) {
      console.error('Error fetching containers:', error);
      throw error;
    }
  }

  async getContainerDetails(id: string): Promise<ContainerInfo> {
    try {
      const response = await this.axiosInstance.get(`/containers/${id}`);
      const item = response.data;
      return {
        id: item.id,
        name: item.name,
        image: item.image,
        state: item.state,
        status: item.status,
        ports: item.ports || [],
        created: item.created,
        tty: item.tty,
        openStdin: item.openStdin,
      };
    } catch (error) {
      console.error('Error fetching container details:', error);
      throw error;
    }
  }

  async startContainer(id: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/containers/${id}/start`);
    } catch (error) {
      console.error('Error starting container:', error);
      throw error;
    }
  }

  async stopContainer(id: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/containers/${id}/stop`);
    } catch (error) {
      console.error('Error stopping container:', error);
      throw error;
    }
  }

  async restartContainer(id: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/containers/${id}/restart`);
    } catch (error) {
      console.error('Error restarting container:', error);
      throw error;
    }
  }

  getContainerLogsWebSocket(id: string): WebSocket | null {
    if (!this.token) {
      console.error('No authentication token available');
      return null;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://felicit.at/dockermanager/api';
    const url = `${wsUrl}/logs?containerId=${id}&token=${this.token}`;

    try {
      return new WebSocket(url);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      return null;
    }
  }
}

export const apiService = new ApiService();
