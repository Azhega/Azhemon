import EventBus from '../utils/EventBus.ts';
import Store from '../utils/Store.ts';
import { MenuController } from './MenuController.ts';

export class MainController {
  private menuController: MenuController | null = null;
  private loadingScreen: HTMLElement;
  
  constructor() {
    this.loadingScreen = document.getElementById('loading-screen') as HTMLElement;

    EventBus.on('screen:changed', (screen) => this.updateScreen(screen));

    EventBus.on('auth:logout', () => {
      this.menuController = null;
    });
    
    // Subscribe to store changes
    Store.subscribe((state) => {
      if (state.game.isLoading) {
        this.showLoading();
      } else {
        this.hideLoading();
      }
    });
  }

  initialize(): void {
    // Show loading screen by default
    this.showLoading();
    // GameController will hide loading screen when data is ready
  }
  
  private updateScreen(screen: string): void {
    document.querySelectorAll('.screen').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    switch (screen) {
      case 'login':
        document.getElementById('login-screen')!.style.display = 'flex';
        break;
      case 'menu':
        if (!this.menuController) {
          this.menuController = new MenuController();
        }
        document.getElementById('menu-screen')!.style.display = 'flex';
        break;
      case 'teambuilder':
        document.getElementById('teambuilder-screen')!.style.display = 'block';
        break;
      case 'battle':
        document.getElementById('battle-screen')!.style.display = 'block';
        break;
    }
  }

  private showLoading(): void {
    this.loadingScreen.style.display = 'flex';
  }
  
  private hideLoading(): void {
    this.loadingScreen.style.display = 'none';
  }
}