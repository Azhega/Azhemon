import teamBuilderView from '../views/teambuilder/TeamBuilderView.template';
import teamBuilderDetailsPanel from '../views/teambuilder/DetailsPanelView.template';
import pokemonSelectorView from '../views/teambuilder/PokemonSelectorView.template';
import itemSelectorView from '../views/teambuilder/ItemSelectorView.template';
import abilitySelectorView from '../views/teambuilder/AbilitySelectorView.template';
import natureSelectorView from '../views/teambuilder/NatureSelectorView.template';
import moveSelectorView from '../views/teambuilder/MoveSelectorView.template';
import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { Pokemon } from '../models/PokemonModel';
import { PokemonAbility, PokemonNature, PokemonItem, PokemonMove } from '../interfaces/PokemonInterface';
import { Pokedex } from '../data/pokedex';
import { items } from '../data/items';
import { moves } from '../data/moves';
import { abilities } from '../data/abilities';
import { natures } from '../data/natures';
import { createBattlePokemon } from '../utils/PokemonFactory';
import ApiService from '../services/ApiService';
import Swal from 'sweetalert2';

export class TeamBuilderController {
  private element: HTMLElement;
  private currentTeam: (Pokemon | null)[] = [null, null, null, null, null, null];
  private selectedPokemonIndex: number | null = null;

  constructor() {
    this.element = document.getElementById('teambuilder-screen')!;
    this.render();
    this.attachEvents();

    this.loadTeams();

    EventBus.on('auth:login-success', () => {
      this.loadTeams();
      this.resetTeamBuilder();
    });

    EventBus.on('auth:logout', () => {
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
  }
  
  private render(): void {
    let template = teamBuilderView;

    template = template.replace('{{TEAM_SLOTS}}', 
      `${Array(6).fill(0).map((_, i) => `
        <div class="pokemon-slot empty" data-slot="${i}">
          <div class="slot-number">${i + 1}</div>
        </div>
      `).join('')}`
    );

    this.element.innerHTML = template;

    this.updateTeamDisplay();
  }
  
  private updateTeamDisplay(): void {
    const teamContainer = document.getElementById('team-slots')!;
    
    // For each slot, update the display
    for (let i = 0; i < 6; i++) {
      const slot = teamContainer.querySelector(`[data-slot="${i}"]`) as HTMLElement;
      const pokemon = this.currentTeam[i];
      
      if (pokemon) {
        slot.className = 'pokemon-slot' + (this.selectedPokemonIndex === i ? ' selected' : '');
        slot.innerHTML = `
          <div class="slot-number">${i + 1}</div>
          <div class="pokemon-preview">
            <img src="assets/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_face.png" 
                alt="${pokemon.name.toLowerCase()}" class="pokemon-sprite">
            <div class="pokemon-info">
              <h3 class="pokemon-name">${pokemon.name}</h3>
              <div class="pokemon-types">
                <img src="assets/public/images/types/${pokemon.types[0].toLowerCase()}.png" alt="${pokemon.types[0]}" class="type-icon">
                ${pokemon.types[1] ? `<img src="assets/public/images/types/${pokemon.types[1]?.toLowerCase()}.png" alt="${pokemon.types[1]}" class="type-icon">` : ''}
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

    let template = teamBuilderDetailsPanel;
    template = template.replace('{{POKEMON_SPRITE}}', `${pokemon?.name.toLowerCase()}/${pokemon?.name.toLowerCase()}`);
    template = template.replace('{{POKEMON_SPRITE_ALT}}', `${pokemon?.name.toLowerCase()}`);
    template = template.replace('{{POKEMON_NAME}}', `${pokemon?.name}`);
    template = template.replace('{{POKEMON_FIRST_TYPE}}', `${pokemon?.types[0].toLowerCase()}`);
    template = template.replace('{{POKEMON_FIRST_TYPE_ALT}}', `${pokemon?.types[0]}`);
      template = template.replace('{{POKEMON_SECOND_TYPE}}', 
        `${pokemon?.types[1] ? `<img src="assets/public/images/types/${pokemon.types[1]?.toLowerCase()}.png" alt="${pokemon.types[1]}" class="type-icon">` : ''}`);
    
    template = template.replace('{{POKEMON_ITEM}}', pokemon?.item?.name || 'Aucun');
    template = template.replace('{{POKEMON_ABILITY}}', pokemon?.ability.name || 'Aucun');
    template = template.replace('{{POKEMON_NATURE}}', pokemon?.nature.name || 'Aucun');

    template = template.replace('{{SELECTED_POKEMON_INDEX}}', `${this.selectedPokemonIndex}`);

    template = template.replace('{{POKEMON_HP}}', `${pokemon?.baseStats.hp || 0}`);
    template = template.replace('{{POKEMON_ATTACK}}', `${pokemon?.baseStats.attack || 0}`);
    template = template.replace('{{POKEMON_DEFENSE}}', `${pokemon?.baseStats.defense || 0}`);
    template = template.replace('{{POKEMON_SPECIAL_ATTACK}}', `${pokemon?.baseStats.specialAttack || 0}`);
    template = template.replace('{{POKEMON_SPECIAL_DEFENSE}}', `${pokemon?.baseStats.specialDefense || 0}`);
    template = template.replace('{{POKEMON_SPEED}}', `${pokemon?.baseStats.speed || 0}`);

    template = template.replace('{{POKEMON_MOVES}}',
      `${Array(4).fill(0).map((_, i) => {
        const move = pokemon?.moves && pokemon?.moves[i] ? pokemon?.moves[i] : null;
        return `
          <div class="move-slot ${!move ? 'empty' : ''} editable" data-attribute="move" data-move-slot="${i}" data-move-index="${i}">
            <div class="move-content">
              <div class="move-data-row">
                <span class="move-name">${move?.name || 'Attaque ' + (i + 1)}</span>
                <div class="move-type-icon">
                  <img src="assets/public/images/types/${move?.type?.toLowerCase() || null}.png" alt="${move?.type || 'Normal'}" class="move-type">
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
      }).join('')}`);

    detailsPanel.innerHTML = template;

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
    const pokemonSpecies = Object.entries(Pokedex);

    let template = pokemonSelectorView;
    template = template.replace('{{SELECTOR_POKEMON_LIST}}', 
      `${pokemonSpecies.map(([key, pokemon]: [string, any]) => `
        <div class="selector-item pokemon-element" 
          data-pokemon-key="${key}" 
          data-pokemon-id="${pokemon.id}" 
          data-pokemon-name="${pokemon.name}">
          <div class="pokemon-data-row">
            <img src="assets/public/images/sprites/${pokemon.name.toLowerCase()}/${pokemon.name.toLowerCase()}_face.png" 
              alt="${pokemon.name}" class="pokemon-icon">
            <span class="pokemon-name">${pokemon.name}</span>
            <div class="pokemon-types">
              <img src="assets/public/images/types/${pokemon.types[0].toLowerCase()}.png" alt="${pokemon.types[0]}" class="type-icon">
              ${pokemon.types[1] ? `<img src="assets/public/images/types/${pokemon.types[1]?.toLowerCase()}.png" alt="${pokemon.types[1]}" class="type-icon">` : ''}
            </div>
            <span class="pokemon-hp">${pokemon.baseStats.hp}</span>
            <span class="pokemon-atk">${pokemon.baseStats.attack}</span>
            <span class="pokemon-def">${pokemon.baseStats.defense}</span>
            <span class="pokemon-spa">${pokemon.baseStats.specialAttack}</span>
            <span class="pokemon-spd">${pokemon.baseStats.specialDefense}</span>
            <span class="pokemon-spe">${pokemon.baseStats.speed}</span>
          </div>
        </div>
      `).join('')}`
    );

    container.innerHTML = template;

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
          this.loadSelector('');
        }
      });
    });
  }

  private loadItemSelector(container: HTMLElement): void {
    const availableItems = Object.entries(items);

    let template = itemSelectorView;
    template = template.replace('{{SELECTOR_ITEM_LIST}}',
      `${availableItems.map(([key, item]: [string, PokemonItem]) => `
        <div class="selector-item item-element" 
          data-item-key="${key}"
          data-item-id="${item.id}" 
          data-item-name="${item.name}">
          <span>${item.name}</span>
          <small>${item.description}</small>
        </div>
      `).join('')}`
    );

    container.innerHTML = template;

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
      
    let template = abilitySelectorView;
    template = template.replace('{{SELECTOR_ABILITY_LIST}}',
      `${filteredAbilities.map(([key, ability]: [string, PokemonAbility]) => `
        <div class="selector-item ability-element" 
          data-ability-key="${key}"
          data-ability-id="${ability.id}" 
          data-ability-name="${ability.name}">
          <span>${ability.name}</span>
          <small>${ability.description}</small>
        </div>
      `).join('')}`
    );

    container.innerHTML = template;

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
            this.loadSelector('');
          }
        }
      });
    });
  }

  private loadNatureSelector(container: HTMLElement): void {
    const availableNatures = Object.entries(natures);

    let template = natureSelectorView;
    template = template.replace('{{SELECTOR_NATURE_LIST}}',
      `${availableNatures.map(([key, nature]: [string, PokemonNature]) => `
        <div class="selector-item nature-element" 
          data-nature-key="${key}"
          data-nature-id="${nature.id}" 
          data-nature-name="${nature.name}">
          <span>${nature.name}</span>
          <small>${nature.description}</small>
        </div>
      `).join('')}`
    );

    container.innerHTML = template; 

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

    let template = moveSelectorView;
    template = template.replace('{{SELECTOR_MOVE_LIST}}',
      `${filteredMoves.map(([key, move]) => `
        <div class="selector-item move-element" 
        data-move-key="${key}"
        data-move-id="${move.id}" 
        data-move-name="${move.name}" 
        data-move-index="${data?.moveIndex || 0}" 
        data-move-type="${move.type}">
          <div class="move-data-row">
            <span class="move-name">${move.name}</span>
            <div class="move-type-icon">
              <img src="assets/public/images/types/${move?.type?.toLowerCase() || 'normal'}.png" alt="${move?.type || 'Normal'}" class="move-type">
            </div>
            <span class="move-category">${move.category}</span>
            <span class="move-power">${move.power || '-'}</span>
            <span class="move-accuracy">${move.accuracy ? move.accuracy + '%' : '-'}</span>
            <span class="move-pp">${move.pp}</span>
          </div>
          <div class="move-description">${move.description || 'Pas d\'effet secondaire'}</div>
        </div>
      `).join('')}`
    );

    container.innerHTML = template;

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
            this.loadSelector('');
          }
        }
      });
    });
  }
  
  private attachEvents(): void {
    document.getElementById('back-to-menu')?.addEventListener('click', () => {
      // Reset the selector
      this.loadSelector('');
      EventBus.emit('teambuilder:back-to-menu');
    });

    document.getElementById('delete-team')?.addEventListener('click', () => {
      const teamNameInput = document.getElementById('team-name-input') as HTMLInputElement;

      // Reset the selector
      this.loadSelector('');

      const teamIndex = Store.getState().currentTeamIndex;
      if (teamIndex) {
        Swal.fire({
          title: 'Confirmation',
          text: 'Veux-tu vraiment supprimer cette équipe ?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Oui, supprimer',
          cancelButtonText: 'Annuler'
        }).then((result) => {
          if (result.isConfirmed) {
            ApiService.delete('team/' + teamIndex)
              .then(() => {
                Swal.fire({
                  title: 'Supprimée !',
                  text: 'Équipe supprimée avec succès !',
                  icon: 'success',
                  confirmButtonText: 'OK'
                });

                // For MenuView team selector
                EventBus.emit('teambuilder:team-deleted');

                teamNameInput.value = ''; // Clear the team name input after deleting
                
                this.loadTeams();
                this.currentTeam = [null, null, null, null, null, null];
                Store.setState({ currentTeam: this.currentTeam , currentTeamIndex: null });
                this.updateTeamDisplay();
              })
              .catch((error) => {
                console.error('Erreur lors de la suppression de l\'équipe:', error);
                Swal.fire({
                  title: 'Erreur',
                  text: 'Erreur lors de la suppression de l\'équipe.',
                  icon: 'error',
                  confirmButtonText: 'OK'
                });
              });
          }
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
      if (!Store.getState().currentTeamIndex && !teamNameInputValue) { // For new teams
        Swal.fire({
          title: 'Erreur',
          text: 'Tu dois donner un nom à ton équipe !',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      if (!teamNameInputValue || teamNameInputValue.length === 0) { // For existing teams
        Swal.fire({
          title: 'Erreur',
          text: 'Tu dois donner un nom à ton équipe !',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      if (!this.currentTeam.some(pokemon => pokemon !== null)) {
        Swal.fire({
          title: 'Erreur',
          text: 'Tu dois ajouter au moins un Pokémon à ton équipe !',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
  
      for (const pokemon of this.currentTeam) {
        if (!pokemon) continue;
        if (pokemon.ability.id === 0 || pokemon.nature.id === 0 || 
          !pokemon.moves || pokemon.moves.every((move: any) => move === null)) {
          Swal.fire({
            title: 'Erreur',
            text: 'Un Pokémon doit avoir un talent, une nature, et au moins une attaque !',
            icon: 'error',
            confirmButtonText: 'OK'
          });
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
          await ApiService.patch('update_team/' + Store.getState().currentTeamIndex, payload);
          Swal.fire({
            title: 'Succès !',
            text: 'Équipe mise à jour avec succès !',
            icon: 'success',
            confirmButtonText: 'OK'
          });

          // For MenuView team selector
          EventBus.emit('teambuilder:team-saved');

          teamNameInput.value = ''; // Clear the input after saving
          this.loadTeams();
          this.currentTeam = [null, null, null, null, null, null];
          Store.setState({ currentTeam: this.currentTeam , currentTeamIndex: null });
          this.updateTeamDisplay();
          return;
        }
        await ApiService.post('create_team', payload);
        Swal.fire({
          title: 'Succès !',
          text: 'Équipe sauvegardée avec succès !',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // For MenuView team selector
        EventBus.emit('teambuilder:team-saved');
      } catch (error) {
        console.error('Erreur lors du saveTeam:', error);
        Swal.fire({
          title: 'Erreur',
          text: "Une erreur est survenue lors de la sauvegarde de l'équipe.",
          icon: 'error',
          confirmButtonText: 'OK'
        });
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
        this.loadSelector('');
        
        const slot = (e.target as HTMLElement).closest('.pokemon-slot');
        if (slot) {
          const slotIndex = parseInt(slot.getAttribute('data-slot') || '0');
          
          if (this.currentTeam[slotIndex]) {
            // If the slot has a Pokémon, select it
            this.selectedPokemonIndex = slotIndex;
            this.updateTeamDisplay();
          } else {
            // If the slot is empty, open the Pokémon selector
            this.selectedPokemonIndex = slotIndex;
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

      this.updateTeamDisplay();
      this.updateButtonStates();
    });
    
    // Dropdown event for teams via API
    const teamsDropdown = document.getElementById('teams-dropdown') as HTMLSelectElement;
    teamsDropdown?.addEventListener('change', async (e: Event) => {
      // Reset the selector
      this.loadSelector('');

      const teamNameInput = document.getElementById('team-name-input') as HTMLInputElement;
      const selectedValue = (e.target as HTMLSelectElement).value;

      const selectedTeamId = parseInt(selectedValue);
      if (isNaN(selectedTeamId)) {
        console.error("Invalid Team ID:", selectedValue);
        return;
      }
      if (selectedTeamId === 0) { // "Sélectionner une équipe" button
        teamNameInput.value = ''; // Clear team name input
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

        teamNameInput.value = teamData.name; // Set team name input

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
          target.closest('.move-slot')?.classList.add('active-edit'); // Remove active edit class
          return;
        }
        
        if (editable) {
          const attribute = editable.getAttribute('data-attribute');
          this.clearEditHighlight();
          editable.classList.add('active-edit');
          
          if (attribute === 'pokemon') {
            this.loadSelector('pokemon');
          } else if (attribute === 'item') {
            this.loadSelector('item');
          } else if (attribute === 'ability') {
            this.loadSelector('ability', this.currentTeam[this.selectedPokemonIndex!]);
          } else if (attribute === 'nature') {
            this.loadSelector('nature');
          } else if (attribute === 'move') {
            const moveIndex = parseInt(editable.getAttribute('data-move-index') || '0');
            const selectedPokemon = this.currentTeam[this.selectedPokemonIndex!];
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
    this.selectedPokemonIndex = null;
    
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

    const hasRequiredAttributes = this.currentTeam
      .filter(pokemon => pokemon !== null)
      .every(pokemon => {
      if (!pokemon) return false;
      const hasAbility = pokemon.ability && pokemon.ability.id !== 0;
      const hasNature = pokemon.nature && pokemon.nature.id !== 0;
      const hasMove = Array.isArray(pokemon.moves) && pokemon.moves.some(move => move !== null);
      return hasAbility && hasNature && hasMove;
      });
    
    const isEditingExistingTeam = Store.getState().currentTeamIndex !== null;
    
    if (saveButton) {
      // Enable save if: has Pokémon OR editing existing team AND pokemons have required attributesAdd commentMore actions
      saveButton.disabled = (!hasAnyPokemon || !hasRequiredAttributes);
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