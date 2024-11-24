// useWebApp.ts
import { useState, useEffect, useCallback } from 'react';
import { WebApp } from '@twa-dev/sdk';

interface ThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color?: string;
}

interface WebAppInfo {
  colorScheme: 'light' | 'dark';
  themeParams: ThemeParams;
  platform: 'android' | 'ios' | 'web' | 'unknown';
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  headerColor: string;
  backgroundColor: string;
  initDataRaw: string;
}

export function useWebApp() {
  const [appInfo, setAppInfo] = useState<WebAppInfo>({
    colorScheme: 'light',
    themeParams: {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      link_color: '#2481cc',
      button_color: '#2481cc',
      button_text_color: '#ffffff'
    },
    platform: 'unknown',
    viewportHeight: window.innerHeight,
    viewportStableHeight: window.innerHeight,
    isExpanded: false,
    headerColor: '#ffffff',
    backgroundColor: '#ffffff',
    initDataRaw: ''
  });

  // Initialize WebApp
  useEffect(() => {
    try {
      if (WebApp.platform) {
        setAppInfo({
          colorScheme: WebApp.colorScheme,
          themeParams: WebApp.themeParams,
          platform: WebApp.platform,
          viewportHeight: WebApp.viewportHeight,
          viewportStableHeight: WebApp.viewportStableHeight,
          isExpanded: WebApp.isExpanded,
          headerColor: WebApp.headerColor,
          backgroundColor: WebApp.backgroundColor,
          initDataRaw: WebApp.initDataRaw
        });

        // Enable back button if needed
        WebApp.enableClosingConfirmation();

        // Set viewport height
        document.documentElement.style.setProperty(
          '--tg-viewport-height',
          `${WebApp.viewportHeight}px`
        );
        document.documentElement.style.setProperty(
          '--tg-viewport-stable-height',
          `${WebApp.viewportStableHeight}px`
        );
      }
    } catch (error) {
      console.error('WebApp initialization error:', error);
    }
  }, []);

  // Handle viewport changes
  useEffect(() => {
    const handleViewportChange = () => {
      setAppInfo(prev => ({
        ...prev,
        viewportHeight: WebApp.viewportHeight,
        viewportStableHeight: WebApp.viewportStableHeight,
        isExpanded: WebApp.isExpanded
      }));

      document.documentElement.style.setProperty(
        '--tg-viewport-height',
        `${WebApp.viewportHeight}px`
      );
      document.documentElement.style.setProperty(
        '--tg-viewport-stable-height',
        `${WebApp.viewportStableHeight}px`
      );
    };

    WebApp.onEvent('viewportChanged', handleViewportChange);
    return () => WebApp.offEvent('viewportChanged', handleViewportChange);
  }, []);

  // Handle theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setAppInfo(prev => ({
        ...prev,
        colorScheme: WebApp.colorScheme,
        themeParams: WebApp.themeParams,
        headerColor: WebApp.headerColor,
        backgroundColor: WebApp.backgroundColor
      }));
    };

    WebApp.onEvent('themeChanged', handleThemeChange);
    return () => WebApp.offEvent('themeChanged', handleThemeChange);
  }, []);

  // UI Helpers
  const showAlert = useCallback((message: string) => {
    WebApp.showAlert(message);
  }, []);

  const showConfirm = useCallback((message: string, callback: (confirmed: boolean) => void) => {
    WebApp.showConfirm(message, callback);
  }, []);

  const showPopup = useCallback((params: {
    title?: string;
    message: string;
    buttons?: string[];
  }) => {
    WebApp.showPopup(params);
  }, []);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    WebApp.HapticFeedback.impactOccurred(type);
  }, []);

  const expandApp = useCallback(() => {
    if (!appInfo.isExpanded) {
      WebApp.expand();
    }
  }, [appInfo.isExpanded]);

  return {
    ...appInfo,
    showAlert,
    showConfirm,
    showPopup,
    hapticFeedback,
    expandApp
  };
}