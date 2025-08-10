'use client';

import { ReactNode } from 'react';
import Icon, { IconName } from './Icon';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: IconName;
  className?: string;
  headerAction?: ReactNode;
  variant?: 'default' | 'glass' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  default: 'bg-white/80 dark:bg-gray-800/80',
  glass: 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg',
  gradient: 'bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90'
};

const sizeStyles = {
  sm: 'p-4',
  md: 'p-6 sm:p-8',
  lg: 'p-8 sm:p-10'
};

export default function Card({
  children,
  title,
  subtitle,
  icon,
  className = '',
  headerAction,
  variant = 'default',
  size = 'md',
  loading = false
}: CardProps) {
  if (loading) {
    return (
      <div className={`
        ${variantStyles[variant]}
        backdrop-blur-sm rounded-2xl 
        border border-gray-200/50 dark:border-gray-700/50 
        shadow-xl ${sizeStyles[size]}
        animate-pulse
        ${className}
      `}>
        {(title || subtitle || icon) && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {icon && (
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-xl mr-4"></div>
              )}
              <div>
                {title && <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>}
                {subtitle && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>}
              </div>
            </div>
            {headerAction && (
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            )}
          </div>
        )}
        <div className="space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      ${variantStyles[variant]}
      backdrop-blur-sm rounded-2xl 
      border border-gray-200/50 dark:border-gray-700/50 
      shadow-xl ${sizeStyles[size]}
      transition-all duration-300
      ${className}
    `}>
      {(title || subtitle || icon || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="flex items-center mb-4 sm:mb-0">
            {icon && (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Icon name={icon} size="md" className="text-white" />
              </div>
            )}
            <div>
              {title && (
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
