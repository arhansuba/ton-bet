// webapp.ts
import { MainButton, HapticFeedback } from '@telegram-apps/sdk';

// Create constants.ts first in the constants folder
export const THEME = {
  COLORS: {
    primary: '#0088CC',
    background: {
      dark: '#232323',
      light: '#FFFFFF'
    }
  }
} as const;

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        MainButton: MainButton;
        HapticFeedback: HapticFeedback;
        colorScheme: 'light' | 'dark';
        setHeaderColor: (color: string) => void;
        expand: () => void;
        enableClosingConfirmation: () => void;
        onEvent: (event: string, callback: () => void) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
        };
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{ text: string; type?: string; }>;
        }, callback: (buttonId: number) => void) => void;
        showAlert: (message: string, callback: () => void) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        showPopupButton: (params: {
          buttons: Array<{ text: string; type: string; }>;
        }, callback: (buttonId: number) => void) => void;
        ready: () => void;
        close: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          query_id?: string;
          start_param?: string;
        };
      };
    };
  }
}

interface WebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface MainButtonConfig {
  text: string;
  onClick: () => void;
  isActive?: boolean;
  isLoading?: boolean;
  color?: `#${string}`;
  textColor?: `#${string}`;
}

class TelegramWebApp {
  private haptic: HapticFeedback;
  private mainButton: MainButton;

  constructor() {
    this.haptic = window.Telegram.WebApp.HapticFeedback;
    this.mainButton = window.Telegram.WebApp.MainButton;
    this.initializeWebApp();
  }

  private initializeWebApp() {
    if (window.Telegram.WebApp.colorScheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      window.Telegram.WebApp.setHeaderColor(THEME.COLORS.background.dark);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      window.Telegram.WebApp.setHeaderColor(THEME.COLORS.background.light);
    }

    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.enableClosingConfirmation();
  }

  public configureMainButton({
    text,
    onClick,
    isLoading = false,
    color = THEME.COLORS.primary,
    textColor = '#FFFFFF'
  }: MainButtonConfig) {
    this.mainButton.setText(text);
    window.Telegram.WebApp.onEvent('mainButtonClicked', onClick);

    this.mainButton.setParams({
      bgColor: color,
      textColor: textColor as `#${string}`,
      isVisible: true
    });

    if (isLoading) {
      // Using setText as a workaround since showProgress is not available
      this.mainButton.setText('Loading...');
    }
  }

  public showMainButton() {
    this.mainButton.show();
  }

  public hideMainButton() {
    this.mainButton.hide();
  }

  public showBackButton() {
    window.Telegram.WebApp.BackButton.show();
  }

  public hideBackButton() {
    window.Telegram.WebApp.BackButton.hide();
  }

  public hapticImpact(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') {
    this.haptic.impactOccurred(type);
  }

  public hapticNotification(type: 'error' | 'success' | 'warning') {
    this.haptic.notificationOccurred(type);
  }

  public hapticSelection() {
    this.haptic.selectionChanged();
  }

  public showPopup({
    title,
    message,
    buttons = ['OK']
  }: {
    title: string;
    message: string;
    buttons?: string[];
  }): Promise<string> {
    return new Promise((resolve) => {
      window.Telegram.WebApp.showPopup({
        title,
        message,
        buttons: buttons.map(text => ({ text })),
      }, (buttonId: number) => {
        resolve(buttons[buttonId]);
      });
    });
  }

  public showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      window.Telegram.WebApp.showAlert(message, () => resolve());
    });
  }

  public showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      window.Telegram.WebApp.showConfirm(message, (confirmed: boolean) => resolve(confirmed));
    });
  }

  public showActionSheet(options: string[]): Promise<string> {
    return new Promise((resolve) => {
      window.Telegram.WebApp.showPopupButton({
        buttons: options.map(text => ({ type: 'default', text })),
      }, (buttonId: number) => {
        resolve(options[buttonId]);
      });
    });
  }

  public ready() {
    window.Telegram.WebApp.ready();
  }

  public close() {
    window.Telegram.WebApp.close();
  }

  public getUserData(): WebAppUser | undefined {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }

  public getQueryId(): string | undefined {
    return window.Telegram.WebApp.initDataUnsafe.query_id;
  }

  public getStartParam(): string | undefined {
    return window.Telegram.WebApp.initDataUnsafe.start_param;
  }
}

export const webAppService = new TelegramWebApp();