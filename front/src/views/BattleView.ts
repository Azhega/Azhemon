export class BattleView {
  private element: HTMLElement;
  
  constructor() {
    this.element = document.getElementById('battle-screen')!;
    this.render();
  }
  
  private render(): void {
    this.element.innerHTML = `
      <div class="battle-container">
        <h1>Battle Screen</h1>
        <p>WIP.</p>
        <button id="back-from-battle" class="back-button">Retour au Menu</button>
      </div>
    `;
    
    document.getElementById('back-from-battle')?.addEventListener('click', () => {
      // To replace with EventBus
      document.getElementById('battle-screen')!.style.display = 'none';
      document.getElementById('menu-screen')!.style.display = 'flex';
    });
  }
}