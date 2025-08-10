/**
 * Utility functions for consistent date formatting across the application
 * to prevent hydration mismatches between server and client rendering
 */

/**
 * Format date consistently for server and client rendering
 * @param date - The date to format (optional, defaults to current date)
 * @returns Formatted date string in MM/DD/YYYY format
 */
export const formatDate = (date?: Date | string): string => {
  const dateObj = date ? new Date(date) : new Date();
  
  try {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    // Fallback if date is invalid
    return 'Invalid Date';
  }
};

/**
 * Format date and time consistently for server and client rendering
 * @param date - The date to format (optional, defaults to current date)
 * @returns Formatted date and time string in MM/DD/YYYY HH:mm:ss format
 */
export const formatDateTime = (date?: Date | string): string => {
  const dateObj = date ? new Date(date) : new Date();
  
  try {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    // Fallback if date is invalid
    return 'Invalid Date';
  }
};

/**
 * Format time only consistently for server and client rendering
 * @param date - The date to format (optional, defaults to current date)
 * @returns Formatted time string in HH:mm:ss format
 */
export const formatTime = (date?: Date | string): string => {
  const dateObj = date ? new Date(date) : new Date();
  
  try {
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    // Fallback if date is invalid
    return 'Invalid Time';
  }
};
