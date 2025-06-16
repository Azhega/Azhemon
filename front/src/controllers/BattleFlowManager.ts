export class BattleFlowManager {
  private static instance: BattleFlowManager;

  private constructor() {}
  
  public static getInstance(): BattleFlowManager {
    if (!BattleFlowManager.instance) {
      BattleFlowManager.instance = new BattleFlowManager();
    }
    return BattleFlowManager.instance;
  }

  public async executeWithDelay(
    stepName: string, 
    action: () => void | Promise<void>, 
    delay: number = 1500
  ): Promise<void> {
    return new Promise(async (resolve) => {      
      try {
        // Execute the action immediately
        await action();
        
        // Wait for the specified delay (for visual timing)
        setTimeout(() => {
          resolve();
        }, delay);
      } catch (error) {
        console.error(`Error in step ${stepName}:`, error);
        resolve(); // Continue even if error
      }
    });
  }

  // Execute multiple steps in sequence
  public async executeSequence(steps: Array<{
    name: string;
    action: () => void | Promise<void>;
    delay?: number;
    message?: string;
  }>): Promise<void> {
    for (const step of steps) {
      await this.executeWithDelay(
        step.name,
        step.action,
        step.delay || 0,
      );
    }
  }
}

export default BattleFlowManager.getInstance();