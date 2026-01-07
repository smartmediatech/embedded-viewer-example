import { LoginCredentials, AuthResponse, User, ApiLoginPayload, ApiLoginResponse } from '../types/auth.types';

const API_BASE_URL = 'https://b.smartmedialabs.io';
const APP_ID = '46fcb627-b237-4706-8175-299801d97cb5';

// Authentication service
class AuthService {
  private readonly STORAGE_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const payload: ApiLoginPayload = {
      token: credentials.email,
      token_type: 'email',
      auth_data: {
        password: credentials.password,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/v1/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'App-Id': APP_ID,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message !== 'Authentication failed') {
            throw new Error('Invalid email or password');
          }
          throw parseError;
        }
      }

      const data: ApiLoginResponse = await response.json();

      // Transform API response to our User type
      const user: User = {
        id: data.payload.user.id,
        email: credentials.email,
        name: `${data.payload.user.properties.first_name || ''} ${data.payload.user.properties.last_name || ''}`.trim() || 'User',
        firstName: data.payload.user.properties.first_name,
        lastName: data.payload.user.properties.last_name,
        avatarUri: data.payload.user.properties.avatar_uri,
      };

      const token = data.payload.access_token.token;
      const refreshToken = data.payload.refresh_token.token;

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

      return { user, token, refreshToken };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
