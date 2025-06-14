import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';
import { Pokemon } from '../models/PokemonModel';
import { Pokedex } from '../data/pokedex';
import { items } from '../data/items';
import { moves } from '../data/moves';
import { abilities } from '../data/abilities';
import { natures } from '../data/natures';
import { createBattlePokemon } from '../utils/PokemonFactory';
import { AudioManager } from '../controllers/AudioManager';

export class MenuView {
  private element: HTMLElement;
  private audioManager: AudioManager;

  constructor() {
    this.element = document.getElementById('menu-screen')!;
    this.audioManager = AudioManager.getInstance();
    this.render();
    this.attachEvents();
    this.loadTeams();
    this.displayTeamPreview(Array(6).fill(null));

    EventBus.on('auth:login-success', () => {
      console.log('MenuView : User logged in - reloading teams in MenuView');
      this.loadTeams();

      const userInfoSpan = document.querySelector('.user-info span');
      if (userInfoSpan) {
        const username = Store.getState().user.username || 'Joueur';
        userInfoSpan.textContent = `Bienvenue, ${username}`;
      }
    });

    EventBus.on('auth:logout', () => {
      console.log('MenuView : User logged out - clearing teams in MenuView');
      this.clearTeams();
    });

    EventBus.on('teambuilder:team-saved', () => {
      this.resetTeamPreview();
    });
    
    EventBus.on('teambuilder:team-deleted', () => {
      this.resetTeamPreview();
    });

    EventBus.on('menu:toggle-music-mute', () => {
      this.toggleMusicMute();
    });
    
  }
  
  private render(): void {
    this.element.innerHTML = `
      <div class="sound-toggle">
        <div class="sound-icon">
          ${this.audioManager.isMusicMuted() ? '🔇' : '🔊'}
        </div>
      </div>
      <div class="menu-container">
        <!-- User info and logout button -->
        <div class="menu-header">
          <div class="user-info">
            <span>Bienvenue, ${Store.getState().user.username || 'Joueur'}</span>
            <button id="logout-button" class="logout-button">Déconnexion</button>
          </div>
        </div>

        <img src="src/public/images/logos/pokemon-logo.png" alt="Pokémon Showdown" class="logo" />
        <h1 style="color:black">Azhemon</h1>
        
        <!-- Team Selection Section -->
        <div class="team-selection-section">
          <div class="team-selector-container">
            <h3>Choisir une équipe</h3>
            <select id="battle-teams-dropdown" class="battle-teams-dropdown">
              <option value="">Chargement des équipes...</option>
            </select>
            
            <div id="selected-team-preview" class="selected-team-preview" style="display: none;">
              <h4>Aperçu de l'équipe</h4>
              <div id="team-preview-slots" class="team-preview-slots">
                <!-- Team preview will be populated here -->
              </div>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="menu-buttons">
          <button id="teambuilder-button" class="menu-button">Team Builder</button>
          <button id="battle-button" class="menu-button" disabled>Lancer le Combat</button>
        </div>
      </div>
    `;
  }

  private clearTeams(): void {
    const dropdown = document.getElementById('battle-teams-dropdown') as HTMLSelectElement;
    if (dropdown) {
      dropdown.innerHTML = `<option value="">Aucune équipe disponible</option>`;
    }
    
    this.displayTeamPreview(Array(6).fill(null));
    Store.setState({ 
      currentBattleTeam: Array(6).fill(null)
    });
    this.updateBattleButtonState();
  }
  
  public async loadTeams(): Promise<void> {
    try {
      const teamsData = await ApiService.getTeamByPlayerId(Store.getState().user.id);
      this.populateTeamsDropdown(teamsData);
    } catch (error) {
      console.error('Erreur lors du chargement des équipes', error);
      const dropdown = document.getElementById('battle-teams-dropdown') as HTMLSelectElement;
      if (dropdown) {
        dropdown.innerHTML = `<option value="">Erreur lors du chargement</option>`;
      }
    }
  }
  
  private populateTeamsDropdown(teams: { id: number; name: string }[]): void {
    const dropdown = document.getElementById('battle-teams-dropdown') as HTMLSelectElement;
    if (!teams || teams.length === 0) {
      dropdown.innerHTML = `<option value="">Aucune équipe disponible</option>`;
    } else {
      dropdown.innerHTML = `<option value="">Sélectionner une équipe pour le combat</option>`;
      dropdown.innerHTML += teams.map(team => 
        `<option value="${team.id}">${team.name}</option>`
      ).join('');
    }
  }
  
  private async loadTeamPreview(teamId: number): Promise<void> {
    try {
      const teamData = await ApiService.getTeamPokemonMoveByTeamId(teamId);
      console.log("Team data for preview:", teamData);
      
      const teamPokemons: (Pokemon | null)[] = Array(6).fill(null);
      
      teamData.pokemons.forEach((apiPokemon) => {
        const slotIndex = apiPokemon.slot - 1; // API uses 1-based indexing
        
        const apiPokemonNature = natures[apiPokemon.nature as keyof typeof natures];
        const apiPokemonAbility = abilities[apiPokemon.ability as keyof typeof abilities];
        const apiPokemonItem = items[apiPokemon.item as keyof typeof items];
        
        const apiPokemonMoves = apiPokemon.moves.map((move: any) => {
          const baseMove = moves[move.name as keyof typeof moves];
          return {
            ...baseMove,
            moveKey: move.name,
            currentPP: baseMove.pp,
            target: null
          };
        });
        
        const battlePokemon = createBattlePokemon(
          apiPokemon.pokemon_name as keyof typeof Pokedex, 
          {
            nature: apiPokemonNature,
            moves: apiPokemonMoves,
            ability: apiPokemonAbility,
            item: apiPokemonItem,
            slot: apiPokemon.slot - 1
          }
        );
        
        battlePokemon.key = apiPokemon.pokemon_name;
        battlePokemon.abilityKey = apiPokemon.ability;
        battlePokemon.natureKey = apiPokemon.nature;
        battlePokemon.itemKey = apiPokemon.item;
        
        teamPokemons[slotIndex] = battlePokemon;
      });
      
      Store.setState({ 
        currentBattleTeam: teamPokemons,
        game: Store.getState().game
      });
      
      this.displayTeamPreview(teamPokemons);
      this.updateBattleButtonState();
      
    } catch (error) {
      console.error("Erreur lors du chargement de l'aperçu de l'équipe:", error);
      this.hideTeamPreview();
    }
  }
  
  public displayTeamPreview(team: (Pokemon | null)[]): void {
    const previewContainer = document.getElementById('selected-team-preview');
    const slotsContainer = document.getElementById('team-preview-slots');
    
    if (!previewContainer || !slotsContainer) return;
    
    slotsContainer.innerHTML = team.map((pokemon, index) => {
      if (!pokemon) {
        return `<div class="preview-slot empty-slot">${index + 1}</div>`;
      }
      
      return `
        <div class="preview-slot filled-slot">
          <img src="src/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_face.png" 
               alt="${pokemon.name}" class="preview-sprite">
          <div class="preview-info">
            <span class="preview-name">${pokemon.name}</span>
            <div class="pokemon-types">
                <img src="src/public/images/types/${pokemon.types[0].toLowerCase()}.png" alt="${pokemon.types[0]}" class="type-icon">
                ${pokemon.types[1] ? `<img src="src/public/images/types/${pokemon.types[1]?.toLowerCase()}.png" alt="${pokemon.types[1]}" class="type-icon">` : ''}
              </div>
          </div>
        </div>
      `;
    }).join('');
    
    previewContainer.style.display = 'block';
  }
  
  private hideTeamPreview(): void {
    const previewContainer = document.getElementById('selected-team-preview');
    if (previewContainer) {
      previewContainer.style.display = 'none';
    }
  }
  
  private updateBattleButtonState(): void {
    const battleButton = document.getElementById('battle-button') as HTMLButtonElement;
    const currentBattleTeam = Store.getState().currentBattleTeam;
    
    if (battleButton) {
      const hasValidTeam = currentBattleTeam && currentBattleTeam.some((pokemon: Pokemon) => pokemon !== null);
      battleButton.disabled = !hasValidTeam;
      
      if (hasValidTeam) {
        battleButton.textContent = 'Lancer le Combat';
        battleButton.classList.add('ready-to-battle');
      } else {
        battleButton.textContent = 'Lancer le Combat';
        battleButton.classList.remove('ready-to-battle');
      }
    }
  }
  
  private attachEvents(): void {
    const teambuilderButton = document.getElementById('teambuilder-button');
    const battleButton = document.getElementById('battle-button');
    const teamsDropdown = document.getElementById('battle-teams-dropdown') as HTMLSelectElement;
    const logoutButton = document.getElementById('logout-button');
    const soundToggle = document.querySelector('.sound-toggle');
    const soundIcon = document.querySelector('.sound-icon') as HTMLElement;
    
    teambuilderButton?.addEventListener('click', () => {
      EventBus.emit('menu:open-teambuilder');
    });
    
    battleButton?.addEventListener('click', () => {
      const currentBattleTeam = Store.getState().currentBattleTeam;
      if (currentBattleTeam && currentBattleTeam.some((pokemon: Pokemon) => pokemon !== null)) {
        EventBus.emit('menu:start-battle');
      }
    });
    
    teamsDropdown?.addEventListener('change', async (e: Event) => {
      const selectedValue = (e.target as HTMLSelectElement).value;
      
      if (!selectedValue) {
        this.displayTeamPreview(Array(6).fill(null));
        Store.setState({ 
          currentBattleTeam: Array(6).fill(null)
        });
        this.updateBattleButtonState();
        return;
      }
      
      const selectedTeamId = parseInt(selectedValue);
      if (isNaN(selectedTeamId)) {
        console.error("Invalid Team ID:", selectedValue);
        return;
      }
      
      await this.loadTeamPreview(selectedTeamId);
    });

    logoutButton?.addEventListener('click', async () => {
      await AuthService.logout();
    });

    soundToggle?.addEventListener('click', () => {
      // Toggle mute state
      const isMuted = this.audioManager.toggleMute();
      
      // Update icon
      soundIcon.textContent = isMuted ? '🔇' : '🔊';
      
      // Add animation class
      soundToggle.classList.add('clicked');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        soundToggle.classList.remove('clicked');
      }, 300);
    });
  }

  public toggleMusicMute(): void {
    const soundIcon = document.querySelector('.sound-icon') as HTMLElement;
    soundIcon.textContent = this.audioManager.isMusicMuted() ? '🔇' : '🔊';
  }

  private resetTeamPreview(): void {
    this.loadTeams();

    // Always clear the current battle team when any team is deleted
    Store.setState({ 
      currentBattleTeam: Array(6).fill(null)
    });
    
    // Reset the dropdown
    const dropdown = document.getElementById('battle-teams-dropdown') as HTMLSelectElement;
    if (dropdown) {
      dropdown.value = '';
    }
    
    this.displayTeamPreview(Array(6).fill(null));
    this.updateBattleButtonState();
  }
}