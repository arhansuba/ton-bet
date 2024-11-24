// index.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { WebApp } from '@telegram-apps/sdk';
import { toast } from 'sonner';
import { 
  ApiResponse, Bet, BetsResponse, CreateBetRequest, 
  JoinBetRequest, ResolveBetRequest, UserStats, GetBetsParams 
} from './types';
import { ENDPOINTS, API_CONFIG_BY_ENDPOINT, buildUrl } from './endpoints';
import { API_CONFIG } from '../../constants';

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;
  
  private constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        // Add Telegram WebApp init data for authentication
        if (WebApp.initData) {
          config.headers['X-Telegram-Init-Data'] = WebApp.initData;
        }
        
        // Add endpoint-specific config
        const endpointConfig = API_CONFIG_BY_ENDPOINT[config.url as keyof typeof API_CONFIG_BY_ENDPOINT];
        if (endpointConfig) {
          config.timeout = endpointConfig.timeout;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message: string }>) => {
        toast.error(error.response?.data?.message || 'Something went wrong');
        return Promise.reject(error);
      }
    );
  }

  // Bet Methods
  public async getBets(params?: GetBetsParams): Promise<ApiResponse<BetsResponse>> {
    const response = await this.api.get<ApiResponse<BetsResponse>>(
      buildUrl(ENDPOINTS.BETS, params as Record<string, string>)
    );
    return response.data;
  }

  public async getBetById(id: string): Promise<ApiResponse<Bet>> {
    const response = await this.api.get<ApiResponse<Bet>>(ENDPOINTS.BET_BY_ID(id));
    return response.data;
  }

  public async createBet(data: CreateBetRequest): Promise<ApiResponse<Bet>> {
    const response = await this.api.post<ApiResponse<Bet>>(ENDPOINTS.BETS, data);
    return response.data;
  }

  public async joinBet(data: JoinBetRequest): Promise<ApiResponse<Bet>> {
    const response = await this.api.post<ApiResponse<Bet>>(
      ENDPOINTS.JOIN_BET(data.betId),
      { amount: data.amount }
    );
    return response.data;
  }

  public async resolveBet(data: ResolveBetRequest): Promise<ApiResponse<Bet>> {
    const response = await this.api.post<ApiResponse<Bet>>(
      ENDPOINTS.RESOLVE_BET(data.betId),
      { winner: data.winner }
    );
    return response.data;
  }

  // User Methods
  public async getUserStats(address: string): Promise<ApiResponse<UserStats>> {
    const response = await this.api.get<ApiResponse<UserStats>>(
      ENDPOINTS.USER_STATS(address)
    );
    return response.data;
  }

  public async getUserBets(address: string, params?: GetBetsParams): Promise<ApiResponse<BetsResponse>> {
    const response = await this.api.get<ApiResponse<BetsResponse>>(
      buildUrl(ENDPOINTS.USER_BETS(address), params as Record<string, string>)
    );
    return response.data;
  }

  // Transaction Methods
  public async verifyTransaction(hash: string): Promise<ApiResponse<boolean>> {
    const response = await this.api.post<ApiResponse<boolean>>(
      ENDPOINTS.VERIFY_TRANSACTION(hash)
    );
    return response.data;
  }

  // Platform Methods
  public async getPlatformStats(): Promise<ApiResponse<{
    totalBets: number;
    totalVolume: string;
    activeBets: number;
  }>> {
    const response = await this.api.get<ApiResponse<{
      totalBets: number;
      totalVolume: string;
      activeBets: number;
    }>>(ENDPOINTS.PLATFORM_STATS);
    return response.data;
  }
}

export const apiService = ApiService.getInstance();