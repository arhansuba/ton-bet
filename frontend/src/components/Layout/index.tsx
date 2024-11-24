
import React from 'react';
import WebApp from '@twa-dev/sdk';
import { useWebApp } from '../../hooks/useWebApp';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '../../utils/cn';
import { 
  Home, 
  Plus, 
  Trophy, 
  Settings, 
  ArrowLeft} from 'lucide-react';
import { WalletConnect } from '@/components/WalletConnect';
import { Button } from '@/components/ui/button';
import styles from './styles.module.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showWallet?: boolean;
}

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home', path: '/' },
  { id: 'create', icon: Plus, label: 'Create', path: '/create' },
  { id: 'leaderboard', icon: Trophy, label: 'Leaders', path: '/leaderboard' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' }
];

export default function Layout({
  children,
  title,
  showBackButton = false,
  showWallet = true
}: LayoutProps) {
  const { colorScheme, themeParams } = useWebApp();
  const [activeTab, setActiveTab] = React.useState('home');

  React.useEffect(() => {
    // Set WebApp theme colors
    WebApp.setHeaderColor(themeParams.bg_color as `#${string}`);
    WebApp.setBackgroundColor(themeParams.bg_color as `#${string}`);

    // Update active tab based on current path
    const path = window.location.pathname;
    const tab = NAV_ITEMS.find(item => item.path === path)?.id || 'home';
    setActiveTab(tab);
  }, [themeParams]);

  const handleNavigation = (path: string, id: string) => {
    if (path === window.location.pathname) return;
    setActiveTab(id);
    WebApp.HapticFeedback.impactOccurred('light');
    window.location.href = path;
  };

  const handleBack = () => {
    WebApp.HapticFeedback.impactOccurred('light');
    window.history.back();
  };

  return (
    <div 
      className={cn(
        styles.layout,
        colorScheme === 'dark' ? 'dark' : ''
      )}
      style={{
        '--tg-theme-bg-color': themeParams.bg_color,
        '--tg-theme-text-color': themeParams.text_color,
        '--tg-theme-hint-color': themeParams.hint_color,
        '--tg-theme-link-color': themeParams.link_color,
        '--tg-theme-button-color': themeParams.button_color,
        '--tg-theme-button-text-color': themeParams.button_text_color,
      } as React.CSSProperties}
    >
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={styles.backButton}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          
          {title && <h1 className={styles.title}>{title}</h1>}

          {showWallet && (
            <div className={styles.walletContainer}>
              <WalletConnect />
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ id, icon: Icon, label, path }) => (
            <button
              key={id}
              onClick={() => handleNavigation(path, id)}
              className={cn(
                styles.navItem,
                activeTab === id && styles.navItemActive
              )}
            >
              <Icon className={styles.navIcon} />
              <span className={styles.navLabel}>{label}</span>
            </button>
          ))}
        </nav>
      </footer>

      <Toaster />
    </div>
  );
}

// Export sub-components for more flexible usage
Layout.Header = function LayoutHeader({ children }: { children: React.ReactNode }) {
  return <div className={styles.headerSection}>{children}</div>;
};

Layout.Content = function LayoutContent({ children }: { children: React.ReactNode }) {
  return <div className={styles.contentSection}>{children}</div>;
};

Layout.Actions = function LayoutActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actionsSection}>{children}</div>;
};