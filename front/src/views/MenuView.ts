import EventBus from '../utils/EventBus';

export class MenuView {
  private element: HTMLElement;
  
  constructor() {
    this.element = document.getElementById('menu-screen')!;
    this.render();
    this.attachEvents();
  }
  
  private render(): void {
    this.element.innerHTML = `
      <div class="menu-container">
        <img src="src/public/images/logos/pokemon-logo.png" alt="Pokémon Showdown" class="logo" />
        <h1>Azhemon</h1>
        <button id="teambuilder-button" class="menu-button">Team Builder</button>
        <button id="battle-button" class="menu-button">Battle</button>
      </div>
    `;
  }
  
  private attachEvents(): void {
    const teambuilderButton = document.getElementById('teambuilder-button');
    const battleButton = document.getElementById('battle-button');
    
    teambuilderButton?.addEventListener('click', () => {
      EventBus.emit('menu:open-teambuilder');
    });
    
    battleButton?.addEventListener('click', () => {
      EventBus.emit('menu:start-battle');
    });
  }
}