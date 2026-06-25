import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export interface ApiEnvelope<T = unknown> {
  code: number;
  data: T;
  message?: string;
  msg?: string;
  status?: string;
}

export interface RequestOptions {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  getToken?: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>;
  getHeaders?: () =>
    | Record<string, string>
    | null
    | undefined
    | Promise<Record<string, string> | null | undefined>;
  isSuccess?: (envelope: ApiEnvelope<unknown>) => boolean;
  getMessage?: (envelope: ApiEnvelope<unknown>) => string;
  onAuthError?: () => void;
}

export interface RequestClient {
  raw: AxiosInstance;
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<T>;
  put: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<T>;
  patch: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<T>;
  delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
}

function defaultIsSuccess(envelope: ApiEnvelope<unknown>) {
  return envelope.code === 0 || envelope.code === 200;
}

function defaultGetMessage(envelope: ApiEnvelope<unknown>) {
  return envelope.message ?? envelope.msg ?? "请求失败";
}

function readBrowserToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("token");
}

function unwrapData<T>(
  response: AxiosResponse<ApiEnvelope<T>>,
  options: Required<Pick<RequestOptions, "isSuccess" | "getMessage">>,
) {
  const envelope = response.data;
  if (!options.isSuccess(envelope)) {
    throw new Error(options.getMessage(envelope));
  }
  return envelope.data;
}

export function createRequest(options: RequestOptions = {}): RequestClient {
  const isSuccess = options.isSuccess ?? defaultIsSuccess;
  const getMessage = options.getMessage ?? defaultGetMessage;
  const instance: AxiosInstance = axios.create({
    baseURL: options.baseURL || "/api",
    timeout: options.timeout || 10000,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const extraHeaders = await options.getHeaders?.();
      if (extraHeaders && config.headers) {
        Object.entries(extraHeaders).forEach(([key, value]) => {
          config.headers.set(key, value);
        });
      }

      const token = options.getToken
        ? await options.getToken()
        : readBrowserToken();
      if (token && config.headers) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && options.onAuthError) {
        options.onAuthError();
      }
      return Promise.reject(error);
    },
  );

  return {
    raw: instance,
    get: async <T>(url: string, config?: AxiosRequestConfig) =>
      unwrapData<T>(await instance.get<ApiEnvelope<T>>(url, config), {
        isSuccess,
        getMessage,
      }),
    post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrapData<T>(await instance.post<ApiEnvelope<T>>(url, data, config), {
        isSuccess,
        getMessage,
      }),
    put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrapData<T>(await instance.put<ApiEnvelope<T>>(url, data, config), {
        isSuccess,
        getMessage,
      }),
    patch: async <T>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ) =>
      unwrapData<T>(await instance.patch<ApiEnvelope<T>>(url, data, config), {
        isSuccess,
        getMessage,
      }),
    delete: async <T>(url: string, config?: AxiosRequestConfig) =>
      unwrapData<T>(await instance.delete<ApiEnvelope<T>>(url, config), {
        isSuccess,
        getMessage,
      }),
  };
}
