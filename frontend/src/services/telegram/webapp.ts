// webapp.ts
import { WebApp, MainButton, HapticFeedback } from '@telegram-apps/sdk';
import { THEME } from '../../constants';

interface MainButtonConfig {
  text: string;
  onClick: () => void;
  isActive?: boolean;
  isLoading?: boolean;
  color?: string;
  textColor?: string;
}

class TelegramWebApp {
  private haptic: HapticFeedback;
  private mainButton: MainButton;

  constructor() {
    this.haptic = WebApp.HapticFeedback;
    this.mainButton = WebApp.MainButton;
    this.initializeWebApp();
  }

  private initializeWebApp() {
    // Set theme variables based on Telegram theme
    if (WebApp.colorScheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      WebApp.setHeaderColor(THEME.COLORS.background.dark);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      WebApp.setHeaderColor(THEME.COLORS.background.light);
    }

    // Configure viewport settings
    WebApp.expand();
    WebApp.enableClosingConfirmation();
  }

  public configureMainButton({
    text,
    onClick,
    isActive = true,
    isLoading = false,
    color = THEME.COLORS.primary,
    textColor = '#FFFFFF'
  }: MainButtonConfig) {
    this.mainButton.setText(text);
    this.mainButton.onClick(onClick);
    this.mainButton.setParams({
      color,
      text_color: textColor,
      is_active: isActive,
      is_visible: true,
    });

    if (isLoading) {
      this.mainButton.showProgress();
    } else {
      this.mainButton.hideProgress();
    }
  }

  public showMainButton() {
    this.mainButton.show();
  }

  public hideMainButton() {
    this.mainButton.hide();
  }

  public showBackButton() {
    WebApp.BackButton.show();
  }

  public hideBackButton() {
    WebApp.BackButton.hide();
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
  }) {
    return new Promise<string>((resolve) => {
      WebApp.showPopup({
        title,
        message,
        buttons: buttons.map(text => ({ text })),
      }, (buttonId) => {
        resolve(buttons[buttonId]);
      });
    });
  }

  public showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      WebApp.showAlert(message, () => resolve());
    });
  }

  public showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      WebApp.showConfirm(message, (confirmed) => resolve(confirmed));
    });
  }

  public showActionSheet(options: string[]): Promise<string> {
    return new Promise((resolve) => {
      WebApp.showPopupButton({
        buttons: options.map(text => ({ type: 'default', text })),
      }, (buttonId) => {
        resolve(options[buttonId]);
      });
    });
  }

  public ready() {
    WebApp.ready();
  }

  public close() {
    WebApp.close();
  }

  public getUserData() {
    return {
      id: WebApp.initDataUnsafe.user?.id,
      firstName: WebApp.initDataUnsafe.user?.first_name,
      lastName: WebApp.initDataUnsafe.user?.last_name,
      username: WebApp.initDataUnsafe.user?.username,
      languageCode: WebApp.initDataUnsafe.user?.language_code,
    };
  }

  public getQueryId() {
    return WebApp.initDataUnsafe.query_id;
  }

  public getStartParam() {
    return WebApp.initDataUnsafe.start_param;
  }
}

export const webAppService = new TelegramWebApp();