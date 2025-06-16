import Store from '../utils/Store';
import EventBus from '../utils/EventBus';

export class AuthService {
  private static baseUrl = 'http://localhost:8099';
  private static refreshTokenPromise: Promise<boolean> | null = null;
  private static tokenCheckInterval: number | null = null;
  private static REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60 * 1000; // Session UX
  private static RENEWAL_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // Session UX

  private static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000;
      return Date.now() > expiration;
    } catch {
      return true;
    }
  }

  static setRefreshTokenTimestamp(): void {
    const now = Date.now();
    localStorage.setItem('refresh_token_issued_at', now.toString());
  }

  static shouldRenewSession(): boolean { // Session UX
    const issuedAt = localStorage.getItem('refresh_token_issued_at');
    
    if (!issuedAt) {
      console.log('No refresh token issued at timestamp, login required');
      return true;
    }

    const refreshTokenAge = Date.now() - parseInt(issuedAt);
    const timeUntilExpiry = this.REFRESH_TOKEN_LIFETIME - refreshTokenAge;
    
    // If less than 2 days remaining, require fresh login
    return timeUntilExpiry < this.RENEWAL_THRESHOLD;
  }

  // Start automatic token validation
  static startTokenValidation(): void {
    const VALIDATION_INTERVAL = 60 * 1000; // 1 minute

    this.tokenCheckInterval = window.setInterval(async () => {
      const token = localStorage.getItem('access_token');
      console.log('Starting token validation...');

      if (!token) {
        this.logout();
        return;
      }

      // Check expiration client-side (no server call)
      if (this.isTokenExpired(token)) {
        console.log('Token expiring, refreshing...');
        const success = await this.refreshToken();
        if (!success) {
          this.logout();
        }
      }
    }, VALIDATION_INTERVAL);
  }

  // Stop automatic token validation
  static stopTokenValidation(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
      console.log('Token validation stopped');
    }
  }

  static async checkAuthStatus(): Promise<boolean> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      return false;
    }

    if (this.shouldRenewSession()) {
      console.log('Refresh token approaching expiry - requiring fresh login');
      return false; // This will redirect to login
    }

    if (this.isTokenExpired(token)) {
      console.log('Access token expired during startup, attempting refresh...');
      const refreshSuccess = await this.refreshToken();
      return refreshSuccess;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Validating token payload:', payload);
      Store.setState({
        user: {
          id: payload.sub,
          username: payload.username,
          role_id: payload.role_id,
          role: payload.role,
          isAuthenticated: true
        }
      });
      
      console.log('Token valid, user authenticated from JWT');
      return true;
    } catch (error) {
      console.log('Invalid token format');
      return false;
    }
  }

  static async refreshToken(): Promise<boolean> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = this.performTokenRefresh();
    
    try {
      const success = await this.refreshTokenPromise;
      return success;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private static async performTokenRefresh(): Promise<boolean> {
    try {
      // Refresh endpoint uses the httpOnly cookie automatically
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        
        Store.setState({
          user: {
            id: data.user_id,
            username: data.username,
            role_id: data.role_id,
            role: data.role,
            isAuthenticated: true
          }
        });
        
        return true;
      }
      
      throw new Error('No access token in refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Helper method to make authenticated requests with automatic retry on 401
  static async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = localStorage.getItem('access_token');
    
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    };

    let response = await fetch(`${this.baseUrl}/${endpoint}`, requestOptions);
    
    // If we get 401 (unauthorized), try to refresh token and retry
    if (response.status === 401 && !endpoint.includes('auth/')) {
      console.log('Got 401, attempting token refresh...');
      const refreshSuccess = await this.refreshToken();
      
      if (refreshSuccess) {
        const newToken = localStorage.getItem('access_token');
        requestOptions.headers = {
          ...requestOptions.headers,
          Authorization: `Bearer ${newToken}`
        };
        
        response = await fetch(`${this.baseUrl}/${endpoint}`, requestOptions);
      } else {
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return await response.json();
  }

  static async logout(): Promise<void> {
    this.stopTokenValidation();

    try {
      // Logout endpoint will clear refresh token cookie and blacklist token
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('access_token') ? {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          } : {})
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage and state regardless of API call success
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token_issued_at');
    
    Store.setState({
      user: {
        id: null,
        username: null,
        role_id: null,
        role: null,
        isAuthenticated: false
      },
      currentBattleTeam: Array(6).fill(null)
    });

    EventBus.emit('auth:logout');
  }
}

export default AuthService;