// format.ts
import { fromNano, toNano } from '@ton/core';
import { WebApp } from '@twa-dev/sdk';

export const formatTon = (amount: string | number, decimals = 2): string => {
  try {
    const value = typeof amount === 'string' ? amount : amount.toString();
    return `${parseFloat(fromNano(value)).toFixed(decimals)} TON`;
  } catch {
    return '0 TON';
  }
};

export const formatDate = (timestamp: number): string => {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(WebApp.platform === 'web' ? 'en-US' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return 'Invalid date';
  }
};

export const formatTimeRemaining = (timestamp: number): string => {
  try {
    const now = Date.now();
    const remaining = timestamp - now;
    
    if (remaining <= 0) return '0m';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  } catch {
    return 'Invalid time';
  }
};

export const formatAddress = (address: string, length = 4): string => {
  try {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  } catch {
    return 'Invalid address';
  }
};

export const formatNumber = (num: number, options?: {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
}): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      notation: 'standard',
      ...options
    }).format(num);
  } catch {
    return '0';
  }
};

export const formatFileSize = (bytes: number): string => {
  try {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  } catch {
    return '0 B';
  }
};

export const slugify = (text: string): string => {
  try {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  } catch {
    return '';
  }
};