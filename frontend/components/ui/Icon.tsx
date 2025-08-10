'use client';

import { SVGProps } from 'react';

export type IconName = 
  | 'dashboard' | 'analytics' | 'settings' | 'connection' | 'account' | 'balance' 
  | 'equity' | 'profit' | 'margin' | 'leverage' | 'server' | 'currency'
  | 'trade' | 'expert' | 'warning' | 'success' | 'error' | 'info'
  | 'loading' | 'refresh' | 'connect' | 'disconnect' | 'shield'
  | 'lightning' | 'chart' | 'wallet' | 'trending-up' | 'trending-down'
  | 'clock' | 'globe' | 'lock' | 'unlock' | 'check' | 'x'
  | 'arrow-up' | 'arrow-down' | 'arrow-right' | 'menu' | 'close'
  | 'eye' | 'eye-off' | 'copy' | 'download' | 'upload'
  | 'user' | 'users' | 'credit-card' | 'bank' | 'calculator'
  | 'activity' | 'signal' | 'wifi' | 'wifi-off' | 'zap'
  | 'dollar-sign' | 'percent' | 'hash' | 'bar-chart' | 'pie-chart'
  | 'power' | 'plug' | 'unplug' | 'sync' | 'pause' | 'play'
  | 'stop' | 'monitor' | 'terminal' | 'network';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const iconPaths: Record<IconName, string> = {
  // Navigation & Core
  dashboard: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M9 22V12h6v10',
  analytics: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  
  // Financial & Trading
  account: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  balance: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  equity: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  profit: 'M7 14l9-9 3 3L12 15l-5-1z',
  margin: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  leverage: 'M13 10V3L4 14h7v7l9-11h-7z',
  wallet: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  
  // Connection & Status
  connection: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  server: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  signal: 'M2 17h20M6 13l4 4 4-4 4 4',
  wifi: 'M1 9l2-2 7 7-7 7-2-2 5-5L1 9zM13 3l7 7-7 7M20 12H8',
  'wifi-off': 'M1 9l2-2 7 7-7 7-2-2 5-5L1 9zM13 3l7 7-7 7M20 12H8m3-3l3-3',
  
  // States & Actions
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  loading: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  
  // Controls
  connect: 'M13 10V3L4 14h7v7l9-11h-7z',
  disconnect: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v6m0 8v6m-8-6h6m8 0h6',
  check: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
  
  // Trends & Charts
  'trending-up': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  'trending-down': 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
  'bar-chart': 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  'pie-chart': 'M21 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9a9 9 0 019 9z M12 12L9 3',
  chart: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  
  // Currency & Financial
  currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
  'dollar-sign': 'M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  percent: 'm19 5-14 14m2-5h.01M17 12h.01',
  'credit-card': 'M1 8h22v8a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm2-4h18a2 2 0 012 2v2H1V6a2 2 0 012-2z',
  bank: 'M3 21h18m-18 0V9m0 12v-9m18 9V9m0 12v-9M1 9l11-7 11 7M7 21v-9h2v9m4 0v-9h2v9',
  calculator: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  
  // Security & Permissions
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V9a4 4 0 00-8 0v2m8 0H8',
  unlock: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
  
  // Trading Actions
  trade: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  expert: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  
  // Misc
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 113 3',
  'eye-off': 'm1 1 22 22M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24',
  lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
  zap: 'M13 10V3L4 14h7v7l9-11h-7z',
  hash: 'M4 9h16M4 15h16m-7-6v12m-2-12v12',
  
  // Navigation
  'arrow-up': 'M12 19V5m-7 7l7-7 7 7',
  'arrow-down': 'M12 5v14m7-7l-7 7-7-7',
  'arrow-right': 'M5 12h14m-7-7l7 7-7 7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 18L18 6M6 6l12 12',
  
  // File operations
  copy: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  
  // Users
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
  users: 'M17 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75M9 21v-2a4 4 0 013-3.87m0-4.25a4 4 0 013 3.75M21 21v-2a4 4 0 00-3-3.87',
  
  // Power & Control
  power: 'M18.36 6.64a9 9 0 11-12.73 0M12 2v10',
  plug: 'M12 2v4m0 0a4 4 0 014 4v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a4 4 0 014-4z',
  unplug: 'M12 2v4m0 0a4 4 0 014 4v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a4 4 0 014-4zM8 6l8 8',
  sync: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  pause: 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
  play: 'M8 5v14l11-7z',
  stop: 'M9 9h6v6H9V9zm12 3a9 9 0 11-18 0 9 9 0 0118 0z',
  monitor: 'M9 17H7A2 2 0 015 15V7a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2M9 17v2a2 2 0 002 2h2a2 2 0 002-2v-2M9 17h6',
  terminal: 'M7 15l4-4-4-4m8 8h-4',
  network: 'M15.5 2H8.6c-.4 0-.6.3-.6.6v18.8c0 .3.2.6.6.6h6.8c.4 0 .6-.3.6-.6V2.6c.1-.3-.2-.6-.5-.6z'
};

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

export default function Icon({ name, size = 'md', className = '', ...props }: IconProps) {
  const path = iconPaths[name];
  
  if (!path) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={path} />
    </svg>
  );
}
