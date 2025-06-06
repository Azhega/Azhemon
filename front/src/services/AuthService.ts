import Store from '../utils/Store';
import EventBus from '../utils/EventBus';

export class AuthService {
  private static baseUrl = 'http://localhost:8099';
  private static refreshTokenPromise: Promise<boolean> | null = null;
  private static tokenCheckInterval: number | null = null;
  private static isCheckingToken = false;
  private static REFRESH_TOKEN_LIFETIME = 30 * 24 * 60 * 60 * 1000;
  private static RENEWAL_THRESHOLD = 2 * 24 * 60 * 60 * 1000;

  static setRefreshTokenTimestamp(): void {
    const now = Date.now();
    localStorage.setItem('refresh_token_issued_at', now.toString());
  }

  static shouldRenewSession(): boolean {
    const issuedAt = localStorage.getItem('refresh_token_issued_at');
    
    if (!issuedAt) {
      console.log('No refresh token issued at timestamp, login required');
      return true;
    }

    const tokenAge = Date.now() - parseInt(issuedAt);
    const timeUntilExpiry = this.REFRESH_TOKEN_LIFETIME - tokenAge;
    
    // If less than 2 days remaining, require fresh login
    return timeUntilExpiry < this.RENEWAL_THRESHOLD;
  }

  // Start automatic token validation
  static startTokenValidation(): void {
    const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

    this.tokenCheckInterval = window.setInterval(async () => {
      if (this.isCheckingToken) return; // Prevent concurrent checks
      
      this.isCheckingToken = true;
      console.log('Automatic token validation check...');
      
      try {
        const isValid = await this.checkAuthStatus();
        if (!isValid) {
          console.log('Session expired - logging out user');
          this.logout();
        } else {
          console.log('Session still valid');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        this.logout();
      } finally {
        this.isCheckingToken = false;
      }
    }, VALIDATION_INTERVAL);

    console.log(`Token validation started (every ${VALIDATION_INTERVAL / 60000} minutes)`);
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

    try {
      const response = await this.makeAuthenticatedRequest('auth/verify');
      
      Store.setState({
        user: {
          id: response.user_id,
          username: response.username,
          role_id: response.role_id,
          role: response.role,
          isAuthenticated: true
        }
      });
      
      return true;
    } catch (error: any) {
      console.log('Token verification failed, attempting refresh...');
      
      const refreshSuccess = await this.refreshToken();
      if (!refreshSuccess) {
        console.log('Both tokens invalid - session expired');
        return false;
      }
      
      return true;
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