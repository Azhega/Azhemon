import { PokemonMove } from '../models/PokemonModel';
import AuthService from './AuthService';

export class ApiService {
  private baseUrl = 'http://localhost:8099';

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

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

  async getTeamPokemonByTeamId(teamId: number): Promise<any[]> {
    return this.getById('team_pokemon/team', teamId);
  }

  async getTeamPokemonByTeamIdAndSlot(teamId: number, slot: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon/team/${teamId}/slot/${slot}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team_pokemon for team ${teamId} and slot ${slot}:`, error);
      throw error;
    }
  }

  async getTeamPokemonByPlayerId(playerId: number): Promise<any[]> {
    return this.getById('team_pokemon/player_id', playerId);
  }

  async getTeamPokemonByPlayerIdAndTeamName(playerId: number, teamName: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon/player_id/${playerId}/team/${teamName}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team_pokemon for player ${playerId} and team ${teamName}:`, error);
      throw error;
    }
  }

  async getTeamPokemonByPlayerIdTeamNameAndSlot(playerId: number, teamName: string, slot: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon/player_id/${playerId}/team/${teamName}/slot/${slot}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team_pokemon for player ${playerId}, team ${teamName}, and slot ${slot}:`, error);
      throw error;
    }
  }

  async getTeamPokemonMoveByPlayerId(playerId: number): Promise<any[]> {
    return this.getById('team_pokemon_move/player_id', playerId);
  }

  async getTeamPokemonMoveByPlayerIdAndTeamName(playerId: number, teamName: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon_move/player_id/${playerId}/team/${teamName}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team_pokemon_move for player ${playerId} and team ${teamName}:`, error);
      throw error;
    }
  }

  async getTeamPokemonMoveByPlayerIdTeamNameAndSlot(playerId: number, teamName: string, slot: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon_move/player_id/${playerId}/team/${teamName}/slot/${slot}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team_pokemon_move for player ${playerId}, team ${teamName}, and slot ${slot}:`, error);
      throw error;
    }
  }

  async getTeamPokemonMoveByPokemonId(pokemonId: number): Promise<any[]> {
    return this.getById('team_pokemon_move/pokemon_id', pokemonId);
  }

  async getTeamPokemonMoveByTeamId(teamId: number): Promise<
  { id: number; name: string; pokemons: { slot: number; pokemon_name: string; 
    moves: PokemonMove[]; ability: string; item: string; nature: string; }[] }> {
    return this.getById('team_pokemon_move/team_id', teamId);
  }

  async getTeamPokemonMoveByTeamIdAndSlot(teamId: number, slot: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon_move/team_id/${teamId}/slot/${slot}`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team_pokemon_move for team ${teamId} and slot ${slot}:`, error);
      throw error;
    }
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

  // Team endpoints
  async createTeam(playerId: number, teamName: string): Promise<any> {
    return this.post('team', { player_id: playerId, name: teamName });
  }

  async updateTeam(teamId: number, updatedData: any): Promise<any> {
    return this.patch(`team/${teamId}`, updatedData);
  }

  async deleteTeam(teamId: number): Promise<void> {
    return this.delete(`team/${teamId}`);
  }

  // Team Pokemon endpoints
  async createTeamPokemon(teamId: number, slot: number, pokemonSpeciesId: number, abilityId: number, itemId: number, natureId: number): Promise<any> {
    return this.post('team_pokemon', { team_id: teamId, slot, pokemon_species_id: pokemonSpeciesId, ability_id: abilityId, item_id: itemId, nature_id: natureId });
  }

  async updateTeamPokemon(teamPokemonId: number, updatedData: any): Promise<any> {
    return this.patch(`team_pokemon/${teamPokemonId}`, updatedData);
  }

  async deleteTeamPokemon(teamPokemonId: number): Promise<void> {
    return this.delete(`team_pokemon/${teamPokemonId}`);
  }

  // Team Pokemon Move endpoints
  async createTeamPokemonMove(teamPokemonId: number, moveId: number, slot: number): Promise<any> {
    return this.post('team_pokemon_move', { team_pokemon_id: teamPokemonId, move_id: moveId, slot });
  }

  async updateTeamPokemonMove(teamPokemonMoveId: number, updatedData: any): Promise<any> {
    return this.patch(`team_pokemon_move/${teamPokemonMoveId}`, updatedData);
  }

  async deleteTeamPokemonMove(teamPokemonMoveId: number): Promise<void> {
    return this.delete(`team_pokemon_move/${teamPokemonMoveId}`);
  }
}

export default new ApiService();