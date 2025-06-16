import EventBus from "../utils/EventBus";

export class AudioManager {
  private static instance: AudioManager;
  private menuMusic: HTMLAudioElement | null = null;
  private battleMusic: HTMLAudioElement | null = null;
  private victoryMusic: HTMLAudioElement | null = null;
  private currentlyPlaying: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  // Initialize music tracks
  public initialize(): void {
    this.menuMusic = new Audio('/src/public/audio/explorers-of-the-sky-theme.mp3');
    this.menuMusic.loop = true;
    this.menuMusic.volume = 1;

    this.battleMusic = new Audio('/src/public/audio/iris-theme.mp3');
    this.battleMusic.loop = true;
    this.battleMusic.volume = 1;
    
    this.victoryMusic = new Audio('/src/public/audio/victory-theme.mp3');
    this.victoryMusic.volume = 1;
  }

  public playMenuMusic(): void {
    this.stopCurrentMusic();
    if (this.menuMusic) {
      this.menuMusic.currentTime = 0;
      this.menuMusic.play().catch(() => {
        console.log('Music autoplay prevented');
        this.isMuted = true;
        EventBus.emit('menu:toggle-music-mute');
      });
      this.isMuted = false;
      EventBus.emit('menu:toggle-music-mute');
      this.currentlyPlaying = this.menuMusic;
    }
  }
  
  public playBattleMusic(): void {
    this.stopCurrentMusic();
    if (this.battleMusic) {
      this.battleMusic.currentTime = 0;
      this.battleMusic.play().catch(() => console.log('Music autoplay prevented'));
      this.currentlyPlaying = this.battleMusic;
    }
  }
  
  public playVictoryMusic(): void {
    this.stopCurrentMusic();
    if (this.victoryMusic) {
      this.victoryMusic.currentTime = 0;
      this.victoryMusic.play().catch(() => console.log('Music autoplay prevented'));
      this.currentlyPlaying = this.victoryMusic;
    }
  }
  
  public stopCurrentMusic(): void {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
      this.currentlyPlaying.currentTime = 0;
    }
    this.currentlyPlaying = null;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    if (this.currentlyPlaying) {
      // If we have music currently playing
      if (this.isMuted) {
        // Mute by pausing
        this.currentlyPlaying.pause();
      } else {
        // Unmute by playing
        this.currentlyPlaying.play().catch(() => console.log('Music resume prevented'));
      }
    }
    
    return this.isMuted;
  }
  
  public isMusicMuted(): boolean {
    return this.isMuted;
  }
}