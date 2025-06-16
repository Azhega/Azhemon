import EventBus from './EventBus';

type Listener = (state: any) => void;

export class Store {
  private static instance: Store;
  private state: any = {};
  private listeners: Listener[] = [];
  
  private constructor() {
    // Initial state
    this.state = {
      game: {
        screen: 'menu', // 'menu', 'teambuilder', 'battle', 'login'
        isLoading: false
      },
      user: {
        id: null,
        username: null,
        role_id: null,
        role: null,
        isAuthenticated: false
      },
      battle: null,
      currentTeam: [],
      currentTeamIndex: null,
      currentBattleTeam: []
    };
  }
  
  static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }
  
  getState(): any {
    // Copy ensures immutability, predictability and encapsulation
    return { ...this.state }; 
  }
  
  setState(newState: any): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // Emits events for each top level key that has changed
    Object.keys(newState).forEach(key => {
      if (oldState[key] !== this.state[key]) {
        EventBus.emit(`store:${key}:updated`, this.state[key]);
      }
    });
    
    this.notify();
  }
  
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    
    // Return an unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export default Store.getInstance();