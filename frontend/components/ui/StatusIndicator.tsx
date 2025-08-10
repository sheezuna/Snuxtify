'use client';

import Icon from './Icon';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

const statusConfig = {
  success: {
    icon: 'success' as const,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-400',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  error: {
    icon: 'error' as const,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-400',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  warning: {
    icon: 'warning' as const,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  info: {
    icon: 'info' as const,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  loading: {
    icon: 'loading' as const,
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    textColor: 'text-gray-700 dark:text-gray-400',
    iconColor: 'text-gray-600 dark:text-gray-400'
  }
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    iconSize: 'xs' as const
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    iconSize: 'sm' as const
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    iconSize: 'md' as const
  }
};

export default function StatusIndicator({ 
  status, 
  label, 
  size = 'md', 
  showIcon = true, 
  animated = false,
  className = '' 
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];

  return (
    <div className={`
      inline-flex items-center 
      ${config.bgColor} 
      ${config.borderColor} 
      ${config.textColor}
      ${sizeConf.padding}
      ${sizeConf.text}
      border rounded-full font-medium
      ${animated ? 'transition-all duration-300' : ''}
      ${className}
    `}>
      {showIcon && (
        <Icon 
          name={config.icon} 
          size={sizeConf.iconSize}
          className={`
            ${config.iconColor} 
            mr-1.5
            ${status === 'loading' ? 'animate-spin' : ''}
            ${animated && status === 'success' ? 'animate-pulse' : ''}
          `}
        />
      )}
      {label}
    </div>
  );
}
