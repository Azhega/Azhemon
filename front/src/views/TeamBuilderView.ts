import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { Pokemon, PokemonAbility, PokemonNature, PokemonItem, PokemonMove } from '../models/PokemonModel';
import { Pokedex } from '../data/pokedex';
import { items } from '../data/items';
import { moves } from '../data/moves';
import { abilities } from '../data/abilities';
import { natures } from '../data/natures';
import { createBattlePokemon } from '../utils/PokemonFactory';
import ApiService from '../services/ApiService';
import { AudioManager } from '../controllers/AudioManager';

export class TeamBuilderView {
  private element: HTMLElement;
  private currentTeam: (Pokemon | null)[] = [null, null, null, null, null, null];
  private currentTeamName: string = '';
  private selectedPokemonIndex: number | null = null;
  private selectedAttributeType: string | null = null; // 'pokemon', 'item', 'ability', 'move'
  private audioManager: AudioManager;

  constructor() {
    this.element = document.getElementById('teambuilder-screen')!;
    this.audioManager = AudioManager.getInstance();
    this.render();
    this.attachEvents();

    this.loadTeams();

    EventBus.on('auth:login-success', () => {
      console.log('User logged in - reloading teams in TeamBuilderView');
      this.loadTeams();
      this.resetTeamBuilder();
    });

    EventBus.on('auth:logout', () => {
      console.log('User logged out - clearing teams in TeamBuilderView');
      this.clearTeams();
      this.resetTeamBuilder();
    });
    
    // Subscribe to team changes in the store
    Store.subscribe((state) => {
      if (state.currentTeam && state.game.screen === 'teambuilder') {
        this.currentTeam = state.currentTeam;
        this.updateTeamDisplay();
      }
    });

    console.log("Store :", Store.getState());
  }
  
  private render(): void {
    this.element.innerHTML = `
      <div class="teambuilder-layout">
        <!-- Left panel - Team management -->
        <div class="team-panel">          
          <div class="teambuilder-header-section">
            <!-- Header with title and back button -->
            <div class="teambuilder-header">
              <h1 class="teambuilder-title">Team Builder</h1>
              <button id="back-to-menu" class="back-button">Retour au Menu</button>
            </div>
            
            <!-- Team controls (dropdown + new team button) -->
            <div class="team-controls">
              <div class="team-selector">
                <label class="teams-label" for="teams-dropdown">Mes équipes</label>
                <select id="teams-dropdown" class="teams-dropdown">
                  <!-- Saved teams will be injected here -->
                </select>
              </div>
              <button id="new-team-btn" class="new-team-button">+ Nouvelle équipe</button>
            </div>
            
            <!-- Team name input -->
            <div class="team-name-controls">
              <label for="team-name-input" class="team-name-label">Nom de l'équipe</label>
              <input type="text" id="team-name-input" placeholder="Entrez un nom d'équipe..." class="team-name-input">
            </div>
          </div>
          
          <div class="team-pokemon-list">
            <h2>Pokémon de l'équipe</h2>
            <div id="team-slots">
              ${Array(6).fill(0).map((_, i) => `
                <div class="pokemon-slot empty" data-slot="${i}">
                  <div class="slot-number">${i + 1}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <button id="delete-team" class="delete-team-button">Supprimer l'équipe</button>
          <button id="save-team" class="save-team-button">Sauvegarder l'équipe</button>
        </div>
        
        <!-- Right panel - Pokemon details & selector -->
        <div class="details-panel">
          <div id="pokemon-details" class="pokemon-details">
            <!-- Pokemon details will be displayed here when a pokemon is selected -->
            <div class="empty-details-message">
              <p>Sélectionnez un Pokémon pour voir et modifier ses détails</p>
            </div>
          </div>
          
          <div id="selector-panel" class="selector-panel">
            <!-- Dynamic content will be loaded here based on what is being edited -->
            <div class="empty-selector-message">
              <p>Cliquez sur un attribut du Pokémon pour le modifier</p>
            </div>
          </div>
        </div>
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
      console.log("pokemon : ", pokemon);
      console.log("currentTeam : ", this.currentTeam);
      
      if (pokemon) {
        slot.className = 'pokemon-slot' + (this.selectedPokemonIndex === i ? ' selected' : '');
        slot.innerHTML = `
          <div class="slot-number">${i + 1}</div>
          <div class="pokemon-preview">
            <img src="src/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_face.png" 
                alt="${pokemon.name.toLowerCase()}" class="pokemon-sprite">
            <div class="pokemon-info">
              <h3 class="pokemon-name">${pokemon.name}</h3>
              <div class="pokemon-types">
                <img src="src/public/images/types/${pokemon.types[0].toLowerCase()}.png" alt="${pokemon.types[0]}" class="type-icon">
                ${pokemon.types[1] ? `<img src="src/public/images/types/${pokemon.types[1]?.toLowerCase()}.png" alt="${pokemon.types[1]}" class="type-icon">` : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        slot.className = 'pokemon-slot empty';
        slot.innerHTML = `<div class="slot-number">${i + 1}</div>`;
      }
    }

    this.updateDetailsPanel();
    this.updateButtonStates();
  }

  private updateDetailsPanel(): void {
    const detailsPanel = document.getElementById('pokemon-details')!;
    
    if (this.selectedPokemonIndex === null || !this.currentTeam[this.selectedPokemonIndex]) {
      detailsPanel.innerHTML = `
        <div class="empty-details-message">
          <p>Sélectionnez un Pokémon pour voir et modifier ses détails</p>
        </div>
      `;
      return;
    }
    
    const pokemon = this.currentTeam[this.selectedPokemonIndex];
    detailsPanel.innerHTML = `
      <div class="pokemon-detail-card">
        <!-- Top row: Pokemon info + attributes in columns -->
        <div class="pokemon-info-row">
          <div class="pokemon-header">
            <img src="src/public/images/sprites/${pokemon?.name.toLowerCase()}/${pokemon?.name.toLowerCase()}_face.png" 
                alt="${pokemon?.name.toLowerCase()}" class="pokemon-avatar">
            <div class="pokemon-title">
              <h2 class="pokemon-name editable" data-attribute="pokemon">${pokemon?.name}</h2>
              <div class="pokemon-types">
                <img src="src/public/images/types/${pokemon?.types[0].toLowerCase()}.png" alt="${pokemon?.types[0]}" class="type-icon">
                ${pokemon?.types[1] ? `<img src="src/public/images/types/${pokemon?.types[1]?.toLowerCase()}.png" alt="${pokemon?.types[1]}" class="type-icon">` : ''}
              </div>
            </div>
          </div>
          
          <div class="pokemon-attributes">
            <div class="attribute-row" data-type="item">
              <span class="attribute-label">Objet</span>
              <span class="attribute-value editable" data-attribute="item">${pokemon?.item?.name || 'Aucun'}</span>
            </div>
            <div class="attribute-row" data-type="ability">
              <span class="attribute-label">Talent</span>
              <span class="attribute-value editable" data-attribute="ability">${pokemon?.ability.name || 'Aucun'}</span>
            </div>
            <div class="attribute-row" data-type="nature">
              <span class="attribute-label">Nature</span>
              <span class="attribute-value editable" data-attribute="nature">${pokemon?.nature.name || 'Aucun'}</span>
            </div>
          </div>
          
          <div class="pokemon-actions">
            <button id="remove-pokemon" class="remove-button" data-slot="${this.selectedPokemonIndex}">
              Retirer
            </button>
          </div>
        </div>
        
        <!-- Bottom row: Stats + Moves in columns -->
        <div class="pokemon-details-row">
          <div class="pokemon-stats">
            <h3>Statistiques</h3>
            <div class="stats-grid">
              <div class="stat-row">
                <span class="stat-label">PV</span>
                <span class="stat-value">${pokemon?.baseStats.hp || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Attaque</span>
                <span class="stat-value">${pokemon?.baseStats.attack || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Défense</span>
                <span class="stat-value">${pokemon?.baseStats.defense || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Att. Spé</span>
                <span class="stat-value">${pokemon?.baseStats.specialAttack || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Déf. Spé</span>
                <span class="stat-value">${pokemon?.baseStats.specialDefense || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Vitesse</span>
                <span class="stat-value">${pokemon?.baseStats.speed || 0}</span>
              </div>
            </div>
          </div>
          
          <div class="pokemon-moves">
            <div class="moves-header-row">
              <h3>Attaques</h3>
              <span class="move-col-header type-col">Type</span>
              <span class="move-col-header category-col">Catégorie</span>
              <span class="move-col-header power-col">Puissance</span>
              <span class="move-col-header accuracy-col">Précision</span>
              <span class="move-col-header pp-col">PP</span>
              <span class="move-col-header action-col"></span>
            </div>
            <div class="moves-list">
              ${Array(4).fill(0).map((_, i) => {
                const move = pokemon?.moves && pokemon?.moves[i] ? pokemon?.moves[i] : null;
                return `
                  <div class="move-slot ${!move ? 'empty' : ''}" data-move-slot="${i}">
                    <div class="move-content">
                      <div class="move-data-row">
                        <span class="editable move-name" data-attribute="move" data-move-index="${i}">${move?.name || 'Attaque ' + (i + 1)}</span>
                        <div class="move-type-icon">
                          <img src="src/public/images/types/${move?.type?.toLowerCase() || null}.png" alt="${move?.type || 'Normal'}" class="move-type">
                        </div>
                        <span class="move-category">${move?.category || '-'}</span>
                        <span class="move-power">${move?.power || '-'}</span>
                        <span class="move-accuracy">${move?.accuracy ? move.accuracy + '%' : '-'}</span>
                        <span class="move-pp">${move?.pp || '-'}</span>
                        <span class="move-action">
                          ${move ? `<button class="remove-move-btn" data-move-index="${i}" title="Supprimer cette attaque">×</button>` : ''}
                        </span>
                      </div>
                      ${move && move.description ? `<div class="move-description">${move.description}</div>` : `<div class="move-description">Pas d'effet secondaire</div>`}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachDetailEvents();
  }

  private async loadTeams(): Promise<void> {
    try {
      const teamsData = await ApiService.getTeamByPlayerId(Store.getState().user.id);
      this.populateTeamsDropdown(teamsData);
    } catch (error) {
      console.error('Erreur lors du chargement des équipes', error);
      const dropdown = document.getElementById('teams-dropdown') as HTMLSelectElement;
      if (dropdown) {
        dropdown.innerHTML = `<option value="">Erreur lors du chargement</option>`;
      }
    }
  }
  
  private populateTeamsDropdown(teams: { id: number; name: string }[]): void {
    const dropdown = document.getElementById('teams-dropdown') as HTMLSelectElement;
    if (!teams || teams.length === 0) {
      dropdown.innerHTML = `<option value="">Aucune équipe disponible</option>`;
    } else {
      dropdown.innerHTML = `<option value="0">Sélectionner une équipe</option>`;
      dropdown.innerHTML += teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
    }
  } 

  private loadSelector(type: string, data?: any): void {
    const selectorPanel = document.getElementById('selector-panel')!;
    this.selectedAttributeType = type;
    
    selectorPanel.innerHTML = '<div class="loading">Chargement...</div>';
    
    switch(type) {
      case 'pokemon':
        this.loadPokemonSelector(selectorPanel);
        break;
      case 'item':
        this.loadItemSelector(selectorPanel);
        break;
      case 'ability':
        this.loadAbilitySelector(selectorPanel, data);
        break;
      case 'move':
        this.loadMoveSelector(selectorPanel, data);
        break;
      case 'nature':
        this.loadNatureSelector(selectorPanel);
        break;
      default:
        selectorPanel.innerHTML = `
          <div class="empty-selector-message">
            <p>Cliquez sur un attribut du Pokémon pour le modifier</p>
          </div>
        `;
    }
  }

  private loadPokemonSelector(container: HTMLElement): void {
    const state = Store.getState();
    const pokemonSpecies = Object.entries(Pokedex);
    console.log("pokemonSpecies : ", pokemonSpecies);
    console.log("state : ", state);
    
    container.innerHTML = `
      <div class="selector-header">
        <h3>Choisir un Pokémon</h3>
        <input type="text" id="pokemon-search" placeholder="Rechercher..." class="search-input">
      </div>
      
      <!-- Add column headers for Pokemon stats -->
      <div class="pokemon-column-headers">
        <span></span>
        <span>Nom</span>
        <span>Types</span>
        <span>PV</span>
        <span>Atk</span>
        <span>Déf</span>
        <span>Spa</span>
        <span>Spd</span>
        <span>Vit</span>
      </div>
      
      <div class="selector-list pokemon-list">
        ${pokemonSpecies.map(([key, pokemon]: [string, any]) => `
          <div class="selector-item pokemon-element" 
            data-pokemon-key="${key}" 
            data-pokemon-id="${pokemon.id}" 
            data-pokemon-name="${pokemon.name}">
            <div class="pokemon-data-row">
              <img src="src/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_face.png" 
                alt="${pokemon.name}" class="pokemon-icon">
              <span class="pokemon-name">${pokemon.name}</span>
              <div class="pokemon-types">
                <img src="src/public/images/types/${pokemon.types[0].toLowerCase()}.png" alt="${pokemon.types[0]}" class="type-icon">
                ${pokemon.types[1] ? `<img src="src/public/images/types/${pokemon.types[1]?.toLowerCase()}.png" alt="${pokemon.types[1]}" class="type-icon">` : ''}
              </div>
              <span class="pokemon-hp">${pokemon.baseStats.hp}</span>
              <span class="pokemon-atk">${pokemon.baseStats.attack}</span>
              <span class="pokemon-def">${pokemon.baseStats.defense}</span>
              <span class="pokemon-spa">${pokemon.baseStats.specialAttack}</span>
              <span class="pokemon-spd">${pokemon.baseStats.specialDefense}</span>
              <span class="pokemon-spe">${pokemon.baseStats.speed}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Attach search event
    const searchInput = document.getElementById('pokemon-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const pokemons = container.querySelectorAll('.pokemon-element');
        
        pokemons.forEach(pokemon => {
          const name = (pokemon as HTMLElement).dataset.pokemonName!.toLowerCase();
          (pokemon as HTMLElement).style.display = name.includes(query) ? 'flex' : 'none';
        });
      });
    }

    // Attach click events to pokemon in list
    const pokemonItems = container.querySelectorAll('.pokemon-element');
    pokemonItems.forEach(pokemon => {
      pokemon.addEventListener('click', async () => {
        if (this.selectedPokemonIndex !== null) {
          const pokemonKey = (pokemon as HTMLElement).dataset.pokemonKey!;
          const PokemonEntry = pokemonSpecies.find(([key, _]) => key === pokemonKey);

          if (!PokemonEntry) {
            console.error("Pokemon not found in species list.");
            return;
          }
          const [key, _] = PokemonEntry;
          console.log('SelectedPokemonIndex:', this.selectedPokemonIndex);

          const selectedPokemon = createBattlePokemon(
            key as keyof typeof Pokedex, 
            {
              nature: { 
                id: 0, name: 'Aucun', description: '',
                atk: 1, def: 1, spa: 1, spd: 1, spe: 1
              },
              moves: [],
              ability: { id: 0, name: 'Aucun', description: ''},
              item: null,
              slot: this.selectedPokemonIndex!
            });
          selectedPokemon.key = key;

          this.updatePokemonInSlot(this.selectedPokemonIndex, selectedPokemon);

          this.clearEditHighlight();

          // Reset the selector
          this.selectedAttributeType = null;
          this.loadSelector('');
        }
      });
    });
  }

  private loadItemSelector(container: HTMLElement): void {
    const availableItems = Object.entries(items);
    
    container.innerHTML = `
      <div class="selector-header">
        <h3>Choisir un objet</h3>
        <input type="text" id="item-search" placeholder="Rechercher..." class="search-input">
      </div>
      <div class="selector-list">
        <div class="selector-item item-element" data-item-id="0">
          <span>Aucun</span>
          <small>Aucun objet équipé</small>
        </div>
        ${availableItems.map(([key, item]: [string, PokemonItem]) => `
          <div class="selector-item item-element" 
            data-item-key="${key}"
            data-item-id="${item.id}" 
            data-item-name="${item.name}">
            <span>${item.name}</span>
            <small>${item.description}</small>
          </div>
        `).join('')}
      </div>
    `;

    const searchInput = container.querySelector('#item-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const itemElements = container.querySelectorAll('.item-element');
        
        itemElements.forEach(element => {
          const name = (element as HTMLElement).dataset.itemName?.toLowerCase() || "";
          (element as HTMLElement).style.display = name.includes(query) ? 'flex' : 'none';
        });
      });
    }

    const itemElements = container.querySelectorAll('.item-element');
    itemElements.forEach(item => {
      item.addEventListener('click', () => {
        if (this.selectedPokemonIndex !== null) {
          const itemKey = (item as HTMLElement).dataset.itemKey!;
          const selectedPokemon = this.currentTeam[this.selectedPokemonIndex!];
          if (selectedPokemon) {
            selectedPokemon.item = items[itemKey as keyof typeof items];
            selectedPokemon.itemKey = itemKey;
            this.updatePokemonInSlot(this.selectedPokemonIndex!, selectedPokemon);
            
            this.clearEditHighlight();
            
            // Reset the selector
            this.selectedAttributeType = null;
            this.loadSelector('');
          }
        }
      });
    });
  }

  private loadAbilitySelector(container: HTMLElement, pokemonData?: Pokemon): void {
    const availableAbilities = pokemonData?.possibleAbilities || [];
    const filteredAbilities = Object.entries(abilities)
      .filter(([key]) => availableAbilities.includes(key));

    container.innerHTML = `
      <div class="selector-header">
        <h3>Choisir un talent</h3>
        <input type="text" id="ability-search" placeholder="Rechercher..." class="search-input">
      </div>
      <div class="selector-list">
        ${filteredAbilities.map(([key, ability]: [string, PokemonAbility]) => `
          <div class="selector-item ability-element" 
            data-ability-key="${key}"
            data-ability-id="${ability.id}" 
            data-ability-name="${ability.name}">
            <span>${ability.name}</span>
            <small>${ability.description}</small>
          </div>
        `).join('')}
      </div>
    `;

    const searchInput = container.querySelector('#ability-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const abilityElements = container.querySelectorAll('.ability-element');
        
        abilityElements.forEach(element => {
          const name = (element as HTMLElement).dataset.abilityName?.toLowerCase() || "";
          (element as HTMLElement).style.display = name.includes(query) ? 'flex' : 'none';
        });
      });
    }

    const abilityElements = container.querySelectorAll('.ability-element');
    abilityElements.forEach(ability => {
      ability.addEventListener('click', () => {
        if (this.selectedPokemonIndex !== null) {
          const abilityKey = (ability as HTMLElement).dataset.abilityKey!;
          const selectedPokemon = this.currentTeam[this.selectedPokemonIndex!];
          if (selectedPokemon) {
            selectedPokemon.ability = abilities[abilityKey as keyof typeof abilities]
            selectedPokemon.abilityKey = abilityKey;
            this.updatePokemonInSlot(this.selectedPokemonIndex!, selectedPokemon);
            
            this.clearEditHighlight();
            
            // Reset the selector
            this.selectedAttributeType = null;
            this.loadSelector('');
          }
        }
      });
    });
  }

  private loadNatureSelector(container: HTMLElement): void {
    const availableNatures = Object.entries(natures);
    
    container.innerHTML = `
      <div class="selector-header">
        <h3>Choisir une nature</h3>
        <input type="text" id="nature-search" placeholder="Rechercher..." class="search-input">
      </div>
      <div class="selector-list">
        ${availableNatures.map(([key, nature]: [string, PokemonNature]) => `
          <div class="selector-item nature-element" 
            data-nature-key="${key}"
            data-nature-id="${nature.id}" 
            data-nature-name="${nature.name}">
            <span>${nature.name}</span>
            <small>${nature.description}</small>
          </div>
        `).join('')}
      </div>
    `;

    const searchInput = container.querySelector('#nature-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = (e.target as HTMLInputElement).value.toLowerCase();
          const natureElements = container.querySelectorAll('.nature-element');
          
          natureElements.forEach(element => {
            const name = (element as HTMLElement).dataset.natureName?.toLowerCase() || "";
            (element as HTMLElement).style.display = name.includes(query) ? 'flex' : 'none';
          });
        });
      }

    const natureElements = container.querySelectorAll('.nature-element');
    natureElements.forEach(nature => {
      nature.addEventListener('click', () => {
        if (this.selectedPokemonIndex !== null) {
          const natureKey = (nature as HTMLElement).dataset.natureKey!;
          const selectedPokemon = this.currentTeam[this.selectedPokemonIndex!];
          if (selectedPokemon) {
            selectedPokemon.nature = natures[natureKey as keyof typeof natures];
            selectedPokemon.natureKey = natureKey;
            selectedPokemon.currentStats = selectedPokemon.calculateStats();
            this.updatePokemonInSlot(this.selectedPokemonIndex!, selectedPokemon);
            
            this.clearEditHighlight();

            // Reset the selector
            this.selectedAttributeType = null;
            this.loadSelector('');
          }
        }
      });
    });
  }

  private loadMoveSelector(container: HTMLElement, data?: { moveIndex: number; selectedPokemon: Pokemon }): void {
    const availableMoves = data?.selectedPokemon.possibleMoves || [];
    const filteredMoves = Object.entries(moves)
      .filter(([key]) => availableMoves.includes(key));

    console.log("moves : ", moves);
    container.innerHTML = `
      <div class="selector-header">
        <h3>Choisir une attaque</h3>
        <input type="text" id="move-search" placeholder="Rechercher..." class="search-input">
      </div>
      
      <!-- Column headers for move data -->
      <div class="move-column-headers">
        <span>Nom</span>
        <span>Type</span>
        <span>Catégorie</span>
        <span>Puissance</span>
        <span>Précision</span>
        <span>PP</span>
      </div>
      
      <div class="selector-list move-selector-list">
        ${filteredMoves.map(([key, move]) => `
          <div class="selector-item move-element" 
          data-move-key="${key}"
          data-move-id="${move.id}" 
          data-move-name="${move.name}" 
          data-move-index="${data?.moveIndex || 0}" 
          data-move-type="${move.type}">
            <div class="move-data-row">
              <span class="move-name">${move.name}</span>
              <div class="move-type-icon">
                <img src="src/public/images/types/${move?.type?.toLowerCase() || 'normal'}.png" alt="${move?.type || 'Normal'}" class="move-type">
              </div>
              <span class="move-category">${move.category}</span>
              <span class="move-power">${move.power || '-'}</span>
              <span class="move-accuracy">${move.accuracy ? move.accuracy + '%' : '-'}</span>
              <span class="move-pp">${move.pp}</span>
            </div>
            <div class="move-description">${move.description || 'Pas d\'effet secondaire'}</div>
          </div>
        `).join('')}
      </div>
    `;

    const searchInput = container.querySelector('#move-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const moveElements = container.querySelectorAll('.move-element');
        
        moveElements.forEach(element => {
          const name = (element as HTMLElement).dataset.moveName!.toLowerCase();
          (element as HTMLElement).style.display = name.includes(query) ? 'flex' : 'none';
        });
      });
    }

    const moveElements = container.querySelectorAll('.move-element');
    moveElements.forEach(move => {
      move.addEventListener('click', () => {
        if (this.selectedPokemonIndex !== null) {
          const moveId = parseInt((move as HTMLElement).dataset.moveId!);
          const moveKey = (move as HTMLElement).dataset.moveKey!;
          const moveIndex = parseInt((move as HTMLElement).dataset.moveIndex!);
          const selectedPokemon = this.currentTeam[this.selectedPokemonIndex!];

          if (selectedPokemon?.moves.some((m: PokemonMove | null) => m?.id === moveId)) {
            // Remove the move if already present
            selectedPokemon.moves = selectedPokemon.moves.map((m) => (m?.id === moveId ? null : m));
          }

          if (selectedPokemon) {
            const baseMove = moves[moveKey as keyof typeof moves];
            selectedPokemon.moves[moveIndex] = {
              ...baseMove,
              moveKey: moveKey,
              currentPP: baseMove.pp,
            };
            
            this.updatePokemonInSlot(this.selectedPokemonIndex!, selectedPokemon);
            
            this.clearEditHighlight();

            // Reset the selector
            this.selectedAttributeType = null;
            this.loadSelector('');
          }
        }
      });
    });
  }
  
  private attachEvents(): void {
    document.getElementById('back-to-menu')?.addEventListener('click', () => {
      // Reset the selector
      this.selectedAttributeType = null;
      this.loadSelector('');
      EventBus.emit('teambuilder:back-to-menu');
    });

    document.getElementById('delete-team')?.addEventListener('click', () => {
      // Reset the selector
      this.selectedAttributeType = null;
      this.loadSelector('');

      const teamIndex = Store.getState().currentTeamIndex;
      if (teamIndex) {
        ApiService.delete('team/' + teamIndex)
          .then(() => {
            alert('Équipe supprimée avec succès !');

            // For MenuView team selector
            EventBus.emit('teambuilder:team-deleted');
            
            this.loadTeams();
            this.currentTeam = [null, null, null, null, null, null];
            Store.setState({ currentTeam: this.currentTeam , currentTeamIndex: null });
            this.updateTeamDisplay();
          })
          .catch((error) => {
            console.error('Erreur lors de la suppression de l\'équipe:', error);
            alert('Erreur lors de la suppression de l\'équipe.');
          });
      } else {
        this.loadTeams();
        this.currentTeam = [null, null, null, null, null, null];
        Store.setState({ currentTeam: this.currentTeam , currentTeamIndex: null });
        this.updateTeamDisplay();
      }
    });

    document.getElementById('save-team')?.addEventListener('click', async () => {
      const teamNameInput = document.getElementById('team-name-input') as HTMLInputElement;
      const teamNameInputValue = teamNameInput.value;
      if (!Store.getState().currentTeamIndex && !teamNameInputValue) {
        alert('Tu dois donner un nom à ton équipe !');
        return;
      }

      if (!this.currentTeam.some(pokemon => pokemon !== null)) {
        alert('Tu dois ajouter au moins un Pokémon à ton équipe !');
        return;
      }
  
      for (const pokemon of this.currentTeam) {
        if (!pokemon) continue;
        if (pokemon.ability.id === 0) {
          alert('Un Pokémon doit avoir un talent !');
          return;
        }
        if (pokemon.nature.id === 0) {
          alert('Un Pokémon doit avoir une nature !');
          return; 
        }
        if (pokemon.moves.length === 0) {
          alert('Un Pokémon doit avoir au moins une attaque !');
          return; 
        }
      }
      
      const pokemonsPayload = this.currentTeam
        .map((pokemon, index) => {
          if (!pokemon) return null;
  
          return {
            slot: index + 1, 
            pokemon_species: pokemon.key,
            ability: pokemon.abilityKey,
            item: pokemon.itemKey,
            nature: pokemon.natureKey,
            moves: (pokemon.moves || []).map((move: any, index: number) => ({
              slot: index + 1,
              move: move?.moveKey
            }))
          };
        })
        .filter(pokemon => pokemon !== null);
      
      const payload = {
        player_id: Store.getState().user.id,
        name: teamNameInputValue ? teamNameInputValue : Store.getState().currentTeamName,
        pokemons: pokemonsPayload
      };
      
      try {
        if (Store.getState().currentTeamIndex) {
          const response = await ApiService.patch('update_team/' + Store.getState().currentTeamIndex, payload);
          console.log('Team updated:', response);
          alert('Équipe mise à jour avec succès !');

          // For MenuView team selector
          EventBus.emit('teambuilder:team-saved');

          teamNameInput.value = ''; // Clear the input after saving
          this.loadTeams();
          this.currentTeam = [null, null, null, null, null, null];
          Store.setState({ currentTeam: this.currentTeam , currentTeamIndex: null });
          this.updateTeamDisplay();
          return;
        }
        const response = await ApiService.post('create_team', payload);
        console.log('Team saved:', response);
        alert('Équipe sauvegardée avec succès !');

        // For MenuView team selector
        EventBus.emit('teambuilder:team-saved');
      } catch (error) {
        console.error('Erreur lors du saveTeam:', error);
        alert("Une erreur est survenue lors de la sauvegarde de l'équipe.");
      }
      teamNameInput.value = ''; // Clear the input after saving
      this.loadTeams();
      this.currentTeam = [null, null, null, null, null, null];
      Store.setState({ currentTeam: this.currentTeam , currentTeamIndex: null });
      this.updateTeamDisplay();
    });
    
    // Click on a Pokémon slot to select it
    const teamContainer = document.getElementById('team-slots');
    if (teamContainer) {
      teamContainer.addEventListener('click', (e) => {
        // Reset the selector
        this.selectedAttributeType = null;
        this.loadSelector('');
        
        const slot = (e.target as HTMLElement).closest('.pokemon-slot');
        if (slot) {
          const slotIndex = parseInt(slot.getAttribute('data-slot') || '0');
          
          if (this.currentTeam[slotIndex]) {
            // If the slot has a Pokémon, select it
            this.selectedPokemonIndex = slotIndex;
            console.log("selectedPokemonIndex : ", this.selectedPokemonIndex);
            this.updateTeamDisplay();
          } else {
            // If the slot is empty, open the Pokémon selector
            this.selectedPokemonIndex = slotIndex;
            console.log("selectedPokemonIndex : ", this.selectedPokemonIndex);
            this.loadSelector('pokemon');
            this.updateTeamDisplay();
          }
        }
      });
    }

    document.getElementById('new-team-btn')?.addEventListener('click', () => {
      // Reset current team
      this.currentTeam = [null, null, null, null, null, null];

      // Reset the selector
      this.selectedAttributeType = null;
      this.loadSelector('');
      
      this.selectedPokemonIndex = null;
      Store.setState({ 
        currentTeam: this.currentTeam, 
        currentTeamIndex: null,
        currentTeamName: null 
      });

      // Reset dropdown
      const teamsDropdown = document.getElementById('teams-dropdown') as HTMLSelectElement;
      if (teamsDropdown) {
        teamsDropdown.value = "0"; // Reset to "Sélectionner une équipe"
      }
      
      // Clear team name input
      const teamNameInput = document.getElementById('team-name-input') as HTMLInputElement;
      if (teamNameInput) {
        teamNameInput.value = '';
      }

      console.log(Store.getState());
      this.updateTeamDisplay();
      this.updateButtonStates();
    });
    
    // Dropdown event for teams via API
    const teamsDropdown = document.getElementById('teams-dropdown') as HTMLSelectElement;
    teamsDropdown?.addEventListener('change', async (e: Event) => {
      // Reset the selector
      this.selectedAttributeType = null;
      this.loadSelector('');

      const selectedValue = (e.target as HTMLSelectElement).value;

      const selectedTeamId = parseInt(selectedValue);
      if (isNaN(selectedTeamId)) {
        console.error("Invalid Team ID:", selectedValue);
        return;
      }
      if (selectedTeamId === 0) { // "Sélectionner une équipe" button
        this.currentTeam = [null, null, null, null, null, null];
        Store.setState({ 
          currentTeam: this.currentTeam, 
          currentTeamIndex: null,
          currentTeamName: null 
        });
        this.updateTeamDisplay();
        return;
      }

      try {
        const teamData = await ApiService.getAllTeamDataByTeamId(selectedTeamId);

        console.log("Selected team data:", teamData);

        this.currentTeam = teamData.pokemons.map((apiPokemon) => {
          const apiPokemonNature = natures[apiPokemon.nature as keyof typeof natures];
          const apiPokemonAbility = abilities[apiPokemon.ability as keyof typeof abilities];
          const apiPokemonItem = items[apiPokemon.item as keyof typeof items];

          const apiPokemonMoves = apiPokemon.moves.map((move: PokemonMove) => {
            const baseMove = moves[move.name as keyof typeof moves];
            return {
              ...baseMove,
              moveKey: baseMove.moveKey,
              currentPP: baseMove.pp,
            }
          });

          console.log('selectedPokemonIndex:', this.selectedPokemonIndex);
          const battlePokemon = createBattlePokemon(apiPokemon.pokemon_name as keyof typeof Pokedex, {
            nature: apiPokemonNature,
            moves: apiPokemonMoves,
            ability: apiPokemonAbility,
            item: apiPokemonItem,
            slot: apiPokemon.slot - 1
          })

          battlePokemon.abilityKey = apiPokemon.ability;
          battlePokemon.natureKey = apiPokemon.nature;
          battlePokemon.itemKey = apiPokemon.item;

          return battlePokemon;
        });

        Store.setState({ currentTeam: [...this.currentTeam], currentTeamIndex: selectedTeamId, currentTeamName: teamData.name });

        console.log("Transformed team data:", this.currentTeam);
        console.log("Store :", Store.getState());

        this.updateTeamDisplay();
      } catch (error) {
        console.error("Erreur lors du chargement de l'équipe :", error);
      }
    });
  }

  private attachDetailEvents(): void {
    // Delegate event for all editable elements
    const detailsPanel = document.getElementById('pokemon-details');
    if (detailsPanel) {
      detailsPanel.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const editable = target.closest('.editable');

        if (target.classList.contains('remove-move-btn')) {
          e.stopPropagation(); // Prevent triggering the editable click
          const moveIndex = parseInt(target.getAttribute('data-move-index') || '0');
          this.removeMove(moveIndex);
          return;
        }
        
        if (editable) {
          const attribute = editable.getAttribute('data-attribute');
          this.clearEditHighlight();
          
          if (attribute === 'pokemon') {
            editable.classList.add('active-edit'); // Editable is active
            this.loadSelector('pokemon');
          } else if (attribute === 'item') {
            editable.parentElement?.classList.add('active-edit');  // Editable's parent is active
            this.loadSelector('item');
          } else if (attribute === 'ability') {
            editable.parentElement?.classList.add('active-edit'); // Editable's parent is active
            this.loadSelector('ability', this.currentTeam[this.selectedPokemonIndex!]);
          } else if (attribute === 'nature') {
            editable.parentElement?.classList.add('active-edit'); // Editable's parent is active
            this.loadSelector('nature');
          } else if (attribute === 'move') {
            const moveIndex = parseInt(editable.getAttribute('data-move-index') || '0');
            const selectedPokemon = this.currentTeam[this.selectedPokemonIndex!];
            editable.parentElement?.parentElement?.classList.add('active-edit'); // Editable parent's parent is active
            this.loadSelector('move', { moveIndex, selectedPokemon });  
          }
        }
      });

      const removeButton = document.getElementById('remove-pokemon');
      if (removeButton) {
        removeButton.addEventListener('click', () => {
          if (this.selectedPokemonIndex !== null) {
            this.updatePokemonInSlot(this.selectedPokemonIndex, null);
            this.selectedPokemonIndex = null;
            this.updateTeamDisplay();

            // Reset the selector
            this.selectedAttributeType = null;
            this.loadSelector('');
          }
        });
      }
    }
  }
  
  updatePokemonInSlot(slotIndex: number, pokemon: Pokemon | null): void {
    this.currentTeam[slotIndex] = pokemon;
    Store.setState({ currentTeam: [...this.currentTeam] });
    this.updateTeamDisplay();
  }

  private removeMove(moveIndex: number): void {
    if (this.selectedPokemonIndex !== null) {
      const selectedPokemon = this.currentTeam[this.selectedPokemonIndex];
      if (selectedPokemon && selectedPokemon.moves) {
        selectedPokemon.moves[moveIndex] = null;
        this.updatePokemonInSlot(this.selectedPokemonIndex, selectedPokemon);
      }
    }
  }

  private resetTeamBuilder(): void {
    this.currentTeam = [null, null, null, null, null, null];
    this.currentTeamName = '';
    this.selectedPokemonIndex = null;
    this.selectedAttributeType = null;
    
    Store.setState({ 
      currentTeam: this.currentTeam,
      currentTeamIndex: null,
      currentTeamName: null
    });
    
    this.updateTeamDisplay();
    
    // Reset dropdown
    const teamsDropdown = document.getElementById('teams-dropdown') as HTMLSelectElement;
    if (teamsDropdown) {
      teamsDropdown.value = "0";
    }

    // Clear team name input
    const teamNameInput = document.getElementById('team-name-input') as HTMLInputElement;
    if (teamNameInput) {
      teamNameInput.value = '';
    }
    
    this.loadSelector('');
  }

  private clearTeams(): void {
    const dropdown = document.getElementById('teams-dropdown') as HTMLSelectElement;
    if (dropdown) {
      dropdown.innerHTML = `<option value="">Aucune équipe disponible</option>`;
    }
  }

  private updateButtonStates(): void {
    const saveButton = document.getElementById('save-team') as HTMLButtonElement;
    const deleteButton = document.getElementById('delete-team') as HTMLButtonElement;
    
    const hasAnyPokemon = this.currentTeam.some(pokemon => pokemon !== null);
    
    const isEditingExistingTeam = Store.getState().currentTeamIndex !== null;
    
    if (saveButton) {
      // Enable save if: has Pokémon OR editing existing team (allow saving empty team as deletion)
      saveButton.disabled = !hasAnyPokemon;
      saveButton.textContent = isEditingExistingTeam ? 'Mettre à jour' : 'Sauvegarder';
    }
    
    if (deleteButton) {
      // Enable delete only when editing an existing team
      deleteButton.disabled = !isEditingExistingTeam;
    }
  }

  private clearEditHighlight(): void {
    const activeElements = this.element.querySelectorAll('.active-edit'); 
    activeElements.forEach(activeElement => activeElement.classList.remove('active-edit'));
  }
}