import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import { MenuView } from './MenuView.ts';
import { TeamBuilderView } from './TeamBuilderView';
import { BattleView } from './BattleView';

class MainView {
  private menuView: MenuView;
  private teamBuilderView: TeamBuilderView;
  private battleView: BattleView;
  
  constructor() {
    this.menuView = new MenuView();
    this.teamBuilderView = new TeamBuilderView();
    this.battleView = new BattleView();
    
    // Hide other views initially
    this.teamBuilderView.hide();
    this.battleView.hide();
    
    // Listen to screen change events
    EventBus.on('screen:changed', (screen) => this.updateScreen(screen));
    
    // Subscribe to store changes
    Store.subscribe((state) => {
      this.updateScreen(state.game.currentScreen);
    });
  }
  
  private updateScreen(screen: string): void {
    this.menuView.hide();
    this.teamBuilderView.hide();
    this.battleView.hide();
    
    switch (screen) {
      case 'menu':
        this.menuView.show();
        break;
      case 'teambuilder':
        this.teamBuilderView.show();
        break;
      case 'battle':
        this.battleView.show();
        break;
    }
  }
}