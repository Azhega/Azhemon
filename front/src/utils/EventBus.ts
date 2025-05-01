type Listener = (data?: any) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Listener[]> = new Map();
  
  private constructor() {}
  
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  on(event: string, callback: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Listener): void {
    if (!this.listeners.has(event)) return;
    
    const filterIndex = this.listeners.get(event)!.findIndex(
      listener => listener === callback
    );
    
    if (filterIndex > -1) {
      this.listeners.get(event)!.splice(filterIndex, 1);
    }
  }
  
  emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event)!.forEach(callback => {
      callback(data);
    });
  }
}

export default EventBus.getInstance();