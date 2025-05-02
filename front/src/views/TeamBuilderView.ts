// src/views/TeamBuilderView.ts
import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { Pokemon } from '../models/PokemonModel';

export class TeamBuilderView {
  private element: HTMLElement;
  private currentTeam: (Pokemon | null)[] = [null, null, null, null, null, null];
  
  constructor() {
    this.element = document.getElementById('teambuilder-screen')!;
    this.render();
    this.attachEvents();
    
    // Subscribe to team changes in the store
    Store.subscribe((state) => {
      if (state.currentTeam) {
        this.currentTeam = state.currentTeam;
        this.updateTeamDisplay();
      }
    });
  }
  
  private render(): void {
    this.element.innerHTML = `
      <div class="teambuilder-container">
        <div class="teambuilder-header">
          <h1 class="teambuilder-title">Team Builder</h1>
          <button id="back-to-menu" class="back-button">Retour au Menu</button>
        </div>
        
        <div class="team-container" id="team-slots">
          ${Array(6).fill(0).map((_, i) => `
            <div class="pokemon-slot empty" data-slot="${i}"></div>
          `).join('')}
        </div>
        
        <button id="save-team" class="save-team-button">Sauvegarder l'équipe</button>
      </div>
      
      <div id="pokemon-selector" style="display: none;">
        <!-- Le sélecteur de Pokémon sera injecté ici -->
      </div>
    `;
    
    this.updateTeamDisplay();
  }
  
  private updateTeamDisplay(): void {
    const teamContainer = document.getElementById('team-slots')!;
    
    // For each slot, update the display
    for (let i = 0; i < 6; i++) {
      const slot = teamContainer.querySelector(`[data-slot="${i}"]`) as HTMLElement;
      const pokemon = this.currentTeam[i];
      
      if (pokemon && typeof pokemon.name === 'string') {
        // If the slot is occupied
        slot.className = 'pokemon-slot';
        slot.innerHTML = `
          <img src="src/public/images/sprites/${pokemon.name}/${pokemon.name.toLowerCase()}_face.png" alt="${pokemon.name.toLowerCase()}" style="width: 100px; height: 100px;">
          <h3>${pokemon.name}</h3>
          <div class="pokemon-types">
            ${pokemon.types.map(type => `<span class="type ${type.toLowerCase()}">${type}</span>`).join('')}
          </div>
        `;
      } else {
        // If slot is empty
        slot.className = 'pokemon-slot empty';
        slot.innerHTML = '';
      }
    }
  }
  
  private attachEvents(): void {
    // Back to menu
    document.getElementById('back-to-menu')?.addEventListener('click', () => {
      EventBus.emit('teambuilder:back-to-menu');
    });
    
    // Save team
    document.getElementById('save-team')?.addEventListener('click', () => {
      EventBus.emit('teambuilder:save-team', this.currentTeam);
    });
    
    // Click on a Pokémon slot to open the Pokémon selector
    document.querySelectorAll('.pokemon-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        const slotIndex = parseInt((e.currentTarget as HTMLElement).dataset.slot || '0');
        EventBus.emit('teambuilder:open-pokemon-selector', { slotIndex });
      });
    });
  }
  
  // Will be called when a Pokémon is selected from the selector
  updatePokemonInSlot(slotIndex: number, pokemon: Pokemon | null): void {
    this.currentTeam[slotIndex] = pokemon;
    this.updateTeamDisplay();
  }
}