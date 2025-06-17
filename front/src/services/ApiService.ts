import { PokemonMove } from '../interfaces/PokemonInterface.ts';
import AuthService from './AuthService';

export class ApiService {
  private baseUrl = 'https://azhemon.fr/api';

  // Use AuthService for all authenticated requests
  async getAll(endpoint: string): Promise<any[]> {
    try {
      return await AuthService.makeAuthenticatedRequest(endpoint);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  }

  async getById(endpoint: string, id: number): Promise<any> {
    try {
      return await AuthService.makeAuthenticatedRequest(`${endpoint}/${id}`);
    } catch (error) {
      console.error(`Error fetching ${endpoint} by ID ${id}:`, error);
      throw error;
    }
  }

  async getTeamByPlayerId(playerId: number): Promise<any[]> {
    return this.getById('team/player_id', playerId);
  }

  // Get all team data
  async getAllTeamDataByTeamId(teamId: number): Promise<
  { id: number; name: string; pokemons: { slot: number; pokemon_name: string; 
    moves: PokemonMove[]; ability: string; item: string; nature: string; }[] }> {
    return this.getById('team_pokemon_move/team_id', teamId);
  }

  // Auth endpoints (login, register, refresh) don't use AuthService
  // Logout use token but have it's own method
  public async post(endpoint: string, body: any): Promise<any> {
    try {
      if (endpoint.startsWith('auth/')) {
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const error = new Error(`API error: ${response.status}`);
          (error as any).status = response.status;
          (error as any).data = errorData;
          throw error;
        }
        
        return await response.json();
      } else {
        return await AuthService.makeAuthenticatedRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(body)
        });
      }
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  }

  public async patch(endpoint: string, body: any): Promise<any> {
    try {
      return await AuthService.makeAuthenticatedRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error(`Error patching ${endpoint}:`, error);
      throw error;
    }
  }

  public async delete(endpoint: string): Promise<void> {
    try {
      await AuthService.makeAuthenticatedRequest(endpoint, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }

  async logout(): Promise<any> {
    return AuthService.logout();
  }
}

export default new ApiService();