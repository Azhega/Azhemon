import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { MenuView } from './MenuView.ts';
import { TeamBuilderView } from './TeamBuilderView';
import { BattleView } from './BattleView';

export class MainView {
  private menuView: MenuView;
  private teamBuilderView: TeamBuilderView;
  private battleView: BattleView;
  private loadingScreen: HTMLElement;
  
  constructor() {
    this.loadingScreen = document.getElementById('loading-screen') as HTMLElement;
    this.menuView = new MenuView();
    this.teamBuilderView = new TeamBuilderView();
    this.battleView = new BattleView();

    // Listen to screen change events
    EventBus.on('screen:changed', (screen) => this.updateScreen(screen));
    
    // Subscribe to store changes
    Store.subscribe((state) => {
      if (state.game.isLoading) {
        this.showLoading();
      } else {
        this.hideLoading();
        this.updateScreen(state.game.currentScreen);
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
      case 'menu':
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