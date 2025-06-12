export class BattleFlowManager {
  private static instance: BattleFlowManager;
  private currentStep: string = ''; // Debug
  
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
      this.setProcessing(stepName); // Debug
      
      try {
        // Execute the action immediately
        await action();
        
        // Wait for the specified delay (for visual timing)
        setTimeout(() => {
          this.clearProcessing(); // Debug
          resolve();
        }, delay);
      } catch (error) {
        console.error(`Error in step ${stepName}:`, error);
        this.clearProcessing();
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

  private setProcessing(stepName: string): void {
    this.currentStep = stepName;
    
    console.log(`=== Battle Flow: Starting ${stepName}`);
  }

  private clearProcessing(): void {
    this.currentStep = '';
    
    console.log(`=== Battle Flow: Completed ${this.currentStep}`);
  }
}

export default BattleFlowManager.getInstance();