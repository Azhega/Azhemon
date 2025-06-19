import EventBus from '../utils/EventBus';
import Store from '../utils/Store';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';
import loginView from '../views/login/LoginView.template';

export class LoginController {
  private element: HTMLElement;
  private isLoginMode: boolean = true;
  private isSubmitting: boolean = false;

  constructor() {
    this.element = document.getElementById('login-screen')!;
    this.render();
    this.attachEvents();
    this.clearInputs();
  }

  private render(): void {
    this.element.innerHTML = loginView;
  }

  private attachEvents(): void {
    const loginTab = document.getElementById('login-tab')!;
    const registerTab = document.getElementById('register-tab')!;
    const authForm = document.getElementById('auth-form')!;
    const toggleMode = document.getElementById('toggle-mode')!;

    loginTab.addEventListener('click', () => this.switchToLogin());
    registerTab.addEventListener('click', () => this.switchToRegister());
    toggleMode.addEventListener('click', (e) => {
      e.preventDefault();
      this.isLoginMode ? this.switchToRegister() : this.switchToLogin();
    });

    authForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  private switchToLogin(): void {
    if (this.isSubmitting) return;

    this.isLoginMode = true;
    document.getElementById('login-tab')!.classList.add('active');
    document.getElementById('register-tab')!.classList.remove('active');
    document.getElementById('confirm-password-group')!.style.display = 'none';
    document.getElementById('submit-button')!.textContent = 'Se connecter';
    document.getElementById('toggle-text')!.innerHTML = 'Pas de compte ? <a href="#" id="toggle-mode">S\'inscrire</a>';
    
    document.getElementById('toggle-mode')!.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchToRegister();
    });
    
    this.clearMessages();
    this.clearInputs();
  }

  private switchToRegister(): void {
    if (this.isSubmitting) return;

    this.isLoginMode = false;
    document.getElementById('login-tab')!.classList.remove('active');
    document.getElementById('register-tab')!.classList.add('active');
    document.getElementById('confirm-password-group')!.style.display = 'flex';
    document.getElementById('submit-button')!.textContent = 'S\'inscrire';
    document.getElementById('toggle-text')!.innerHTML = 'Déjà un compte ? <a href="#" id="toggle-mode">Se connecter</a>';
    
    document.getElementById('toggle-mode')!.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchToLogin();
    });
    
    this.clearMessages();
    this.clearInputs();
  }

  private async handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (this.isSubmitting) return;

    this.clearMessages();

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (!username || !password) {
      this.showError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!this.isLoginMode) {
      if (password !== confirmPassword) {
        this.showError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (password.length <= 5 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        this.showError('Le mot de passe doit contenir au moins 6 caractères, une majuscule et un chiffre.');
        return;
      }
    }

    // Set submitting state and disable interactions to avoid multiple submissions
    this.setSubmittingState(true);

    try {
      if (this.isLoginMode) {
        await this.handleLogin(username, password);
      } else {
        await this.handleRegister(username, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showError('Une erreur est survenue. Veuillez réessayer.');
      this.setSubmittingState(false);
    }
  }

  private async handleLogin(username: string, password: string): Promise<void> {
    try {
      const response = await ApiService.post('auth/login', {
        username,
        password_hash: password
      });

      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);

        // Set refresh token timestamp for future sessions validity checks
        AuthService.setRefreshTokenTimestamp();
        
        Store.setState({
          user: {
            id: response.user_id,
            username: response.username,
            role_id: response.role_id,
            role: response.role,
            isAuthenticated: true
          }
        });

        // Start automatic token validation
        AuthService.startTokenValidation();

        this.showSuccess('Connexion réussie !');
        this.clearInputs();
        
        // Redirect to menu after a short delay
        setTimeout(() => {
          EventBus.emit('auth:login-success');
        }, 1000);
      }
    } catch (error: any) {
      this.setSubmittingState(false);

      if (error.message.includes('401')) {
        this.showError('Identifiants incorrects.');
      } else {
        this.showError('Erreur de connexion. Veuillez réessayer.');
      }
    }
  }

  private async handleRegister(username: string, password: string): Promise<void> {
    try {
      const response = await ApiService.post('auth/register', {
        username,
        password_hash: password
      });

      if (response.message) {
        this.showSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        this.clearInputs();

        setTimeout(() => {
          this.switchToLogin();
          this.setSubmittingState(false);
        }, 1000);
      }
    } catch (error: any) {
      this.setSubmittingState(false);

      if (error.message.includes('User already exists')) {
        this.showError('Ce nom d\'utilisateur existe déjà.');
      } else {
        this.showError('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    }
  }

  private setSubmittingState(isSubmitting: boolean): void {
    this.isSubmitting = isSubmitting;
    
    const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
    const loginTab = document.getElementById('login-tab') as HTMLButtonElement;
    const registerTab = document.getElementById('register-tab') as HTMLButtonElement;
    const toggleLink = document.getElementById('toggle-mode') as HTMLElement;
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement;

    if (isSubmitting) {
      submitButton.disabled = true;
      submitButton.textContent = this.isLoginMode ? 'Connexion...' : 'Inscription...';
      submitButton.classList.add('submitting');
      
      loginTab.disabled = true;
      registerTab.disabled = true;
      toggleLink.style.pointerEvents = 'none';
      toggleLink.style.opacity = '0.5';
      
      usernameInput.disabled = true;
      passwordInput.disabled = true;
      if (confirmPasswordInput) {
        confirmPasswordInput.disabled = true;
      }
    } else {
      submitButton.disabled = false;
      submitButton.textContent = this.isLoginMode ? 'Se connecter' : 'S\'inscrire';
      submitButton.classList.remove('submitting');
      
      loginTab.disabled = false;
      registerTab.disabled = false;
      toggleLink.style.pointerEvents = 'auto';
      toggleLink.style.opacity = '1';
      
      usernameInput.disabled = false;
      passwordInput.disabled = false;
      if (confirmPasswordInput) {
        confirmPasswordInput.disabled = false;
      }
    }
  }

  private clearInputs(): void {
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement;

    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
  }

  private showError(message: string): void {
    const errorElement = document.getElementById('error-message')!;
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    document.getElementById('success-message')!.style.display = 'none';
  }

  private showSuccess(message: string): void {
    const successElement = document.getElementById('success-message')!;
    successElement.textContent = message;
    successElement.style.display = 'block';
    document.getElementById('error-message')!.style.display = 'none';
  }

  private clearMessages(): void {
    document.getElementById('error-message')!.style.display = 'none';
    document.getElementById('success-message')!.style.display = 'none';
  }

  public reset(): void {
    this.setSubmittingState(false);
    this.clearInputs();
    this.clearMessages();
    if (!this.isLoginMode) {
      this.switchToLogin();
    }
  }
}