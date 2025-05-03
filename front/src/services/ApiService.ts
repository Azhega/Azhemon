export class ApiService {
  private baseUrl = 'http://azhemon.azh:8099/back';

  async getAll(endpoint: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  }

  async getById(endpoint: string, id: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}/${id}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint} by ID ${id}:`, error);
      throw error;
    }
  }

  async getTeamByPlayerId(playerId: number): Promise<any[]> {
    return this.getById('team', playerId);
  }

  async getTeamPokemonByTeamId(teamId: number): Promise<any[]> {
    return this.getById('team_pokemon/team', teamId);
  }

  async getTeamPokemonByTeamIdAndSlot(teamId: number, slot: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon/team/${teamId}/slot/${slot}`);
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
      const response = await fetch(`${this.baseUrl}/team_pokemon/player_id/${playerId}/team/${teamName}`);
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
      const response = await fetch(`${this.baseUrl}/team_pokemon/player_id/${playerId}/team/${teamName}/slot/${slot}`);
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
      const response = await fetch(`${this.baseUrl}/team_pokemon_move/player_id/${playerId}/team/${teamName}`);
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
      const response = await fetch(`${this.baseUrl}/team_pokemon_move/player_id/${playerId}/team/${teamName}/slot/${slot}`);
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

  async getTeamPokemonMoveByTeamId(teamId: number): Promise<any[]> {
    return this.getById('team_pokemon_move/team_id', teamId);
  }

  async getTeamPokemonMoveByTeamIdAndSlot(teamId: number, slot: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/team_pokemon_move/team_id/${teamId}/slot/${slot}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching team_pokemon_move for team ${teamId} and slot ${slot}:`, error);
      throw error;
    }
  }

  async getType(): Promise<any[]> {
    return this.getAll('type');
  }

  // Helper method for POST requests
  private async post(endpoint: string, body: any, token?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  }

  // Helper method for PATCH requests
  private async patch(endpoint: string, body: any, token?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error patching ${endpoint}:`, error);
      throw error;
    }
  }

  // Helper method for DELETE requests
  private async delete(endpoint: string, token?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(username: string, password: string): Promise<any> {
    return this.post('register', { username, password });
  }

  async login(username: string, password: string): Promise<any> {
    return this.post('login', { username, password });
  }

  async logout(token: string): Promise<void> {
    return this.post('logout', {}, token);
  }

  async refresh(token: string): Promise<any> {
    return this.post('refresh', {}, token);
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