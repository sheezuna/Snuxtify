'use client';

import Icon, { IconName } from './Icon';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: IconName;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value?: string;
    percentage?: number;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  subtitle?: string;
  loading?: boolean;
}

const colorVariants = {
  blue: {
    bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    border: 'border-blue-200/50 dark:border-blue-700/30',
    icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-300'
  },
  green: {
    bg: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20',
    border: 'border-emerald-200/50 dark:border-emerald-700/30',
    icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  red: {
    bg: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    border: 'border-red-200/50 dark:border-red-700/30',
    icon: 'bg-red-500/20 text-red-600 dark:text-red-400',
    text: 'text-red-700 dark:text-red-300'
  },
  yellow: {
    bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
    border: 'border-yellow-200/50 dark:border-yellow-700/30',
    icon: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-300'
  },
  purple: {
    bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    border: 'border-purple-200/50 dark:border-purple-700/30',
    icon: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    text: 'text-purple-700 dark:text-purple-300'
  },
  indigo: {
    bg: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
    border: 'border-indigo-200/50 dark:border-indigo-700/30',
    icon: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    text: 'text-indigo-700 dark:text-indigo-300'
  },
  gray: {
    bg: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20',
    border: 'border-gray-200/50 dark:border-gray-700/30',
    icon: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
    text: 'text-gray-700 dark:text-gray-300'
  }
};

const sizeVariants = {
  sm: {
    padding: 'p-3',
    iconSize: 'w-6 h-6',
    titleText: 'text-xs',
    valueText: 'text-sm',
    trendText: 'text-xs'
  },
  md: {
    padding: 'p-4',
    iconSize: 'w-8 h-8',
    titleText: 'text-sm',
    valueText: 'text-lg',
    trendText: 'text-sm'
  },
  lg: {
    padding: 'p-6',
    iconSize: 'w-10 h-10',
    titleText: 'text-base',
    valueText: 'text-2xl',
    trendText: 'text-base'
  }
};

export default function MetricCard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  size = 'md',
  className = '',
  onClick,
  subtitle,
  loading = false
}: MetricCardProps) {
  const colorConfig = colorVariants[color];
  const sizeConfig = sizeVariants[size];

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <Icon name="trending-up" size="sm" className="text-green-500" />;
      case 'down':
        return <Icon name="trending-down" size="sm" className="text-red-500" />;
      default:
        return <Icon name="arrow-right" size="sm" className="text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`
        bg-gradient-to-br ${colorConfig.bg}
        border ${colorConfig.border}
        rounded-xl ${sizeConfig.padding}
        animate-pulse
        ${className}
      `}>
        <div className="flex items-center justify-between mb-2">
          <div className={`${sizeConfig.iconSize} bg-gray-300 dark:bg-gray-600 rounded-lg`}></div>
        </div>
        <div className={`h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2`}></div>
        <div className={`h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4`}></div>
      </div>
    );
  }

  return (
    <div 
      className={`
        bg-gradient-to-br ${colorConfig.bg}
        border ${colorConfig.border}
        rounded-xl ${sizeConfig.padding}
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`
          ${sizeConfig.iconSize} 
          ${colorConfig.icon}
          rounded-lg flex items-center justify-center
        `}>
          <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            {trend.value && (
              <span className={`font-medium ${sizeConfig.trendText}`}>
                {trend.value}
              </span>
            )}
            {trend.percentage !== undefined && (
              <span className={`font-medium ${sizeConfig.trendText}`}>
                {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className={`${colorConfig.text} ${sizeConfig.titleText} font-medium mb-1`}>
        {title}
      </div>

      <div className={`text-gray-900 dark:text-white ${sizeConfig.valueText} font-bold mb-1`}>
        {value}
      </div>

      {subtitle && (
        <div className={`text-gray-500 dark:text-gray-400 ${sizeConfig.trendText}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
