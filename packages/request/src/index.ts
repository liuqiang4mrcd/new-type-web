import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

export interface RequestOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  onAuthError?: () => void;
}

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export function createRequest(options: RequestOptions = {}): AxiosInstance {
  const instance: AxiosInstance = axios.create({
    baseURL: options.baseURL || '/api',
    timeout: options.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => {
      const { data } = response;
      if (data.code !== 0) {
        return Promise.reject(new Error(data.message || '请求失败'));
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 401 && options.onAuthError) {
        options.onAuthError();
      }
      return Promise.reject(error);
    },
  );

  return instance;
}
