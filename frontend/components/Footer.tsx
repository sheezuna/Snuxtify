'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [currentYear] = useState(new Date().getFullYear());
  const [systemStats, setSystemStats] = useState({
    uptime: '99.9%',
    latency: '< 1ms',
    requests: '2.4M',
    activeUsers: '1,247'
  });

  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        requests: `${(parseFloat(prev.requests.replace('M', '')) + Math.random() * 0.1).toFixed(1)}M`,
        activeUsers: `${Math.floor(Math.random() * 100) + 1200}`,
        latency: `${Math.floor(Math.random() * 3) + 1}ms`
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    'Real-time Streaming',
    'Advanced Analytics', 
    'Mobile Responsive',
    'Dark Mode Support',
    'High Performance',
    'Bank-Grade Security'
  ];

  const technicalLinks = [
    { label: 'API Documentation', href: '#' },
    { label: 'WebSocket Guide', href: '#' },
    { label: 'Integration Examples', href: '#' },
    { label: 'SDK Downloads', href: '#' }
  ];

  const supportLinks = [
    { label: 'Help Center', href: '#' },
    { label: 'Community Forum', href: '#' },
    { label: 'Contact Support', href: '#' },
    { label: 'Report Issue', href: '#' }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-white/95 via-gray-50/95 to-slate-100/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-700/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 mt-16">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Brand & Description */}
            <div className="lg:col-span-5">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl opacity-20 animate-pulse-glow"></div>
                </div>
                <div className="ml-4">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Snuxtify Bot
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Professional Trading Platform
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-md mb-6">
                Advanced MetaTrader 5 monitoring platform with enterprise-grade real-time data synchronization, 
                comprehensive analytics, and professional trading insights powered by cutting-edge technology.
              </p>
              
              {/* Real-time System Status */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      System Status: Operational
                    </span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    Live
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">Uptime</span>
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">{systemStats.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">Latency</span>
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">{systemStats.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">Requests</span>
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">{systemStats.requests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">Users</span>
                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">{systemStats.activeUsers}</span>
                  </div>
                </div>
              </div>

              {/* Technology Stack */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                  Next.js 15
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></div>
                  TypeScript
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5"></div>
                  Tailwind CSS
                </div>
              </div>
            </div>

            {/* Features & Capabilities */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Key Features
              </h4>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors group">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Resources */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Developers
              </h4>
              <ul className="space-y-3">
                {technicalLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center group"
                    >
                      <svg className="w-3 h-3 mr-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support & Help */}
            <div className="lg:col-span-3">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
                </svg>
                Support & Resources
              </h4>
              <ul className="space-y-3 mb-6">
                {supportLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center group"
                    >
                      <svg className="w-3 h-3 mr-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Quick Contact */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30">
                <h5 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
                  Need immediate assistance?
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Our support team is available 24/7 to help with technical issues.
                </p>
                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* Performance Metrics Bar */}
          <div className="mt-12 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
              {[
                { label: 'Uptime', value: '99.9%', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                { label: 'Response Time', value: '< 1ms', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { label: 'Data Points/sec', value: '50K+', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
                { label: 'Active Traders', value: '1.2K+', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
                { label: 'API Calls/min', value: '2.4M', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { label: 'Success Rate', value: '99.8%', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map((metric, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-900/30 dark:group-hover:to-indigo-900/30 transition-all duration-300">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={metric.icon} />
                      </svg>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  © {currentYear} Snuxtify Bot. Advanced Trading Technology Platform.
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
                  <span>•</span>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
                  <span>•</span>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Cookie Policy</a>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    SSL Secured
                  </div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Ultra-Fast
                  </div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Enterprise Security
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  v2.1.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
