// backend/utils/dateValidator.js

/**
 * Validates if the given date and time string represent a time in the future
 * compared to the current server time.
 * @param {string} dateStr - Date string in format 'YYYY-MM-DD'
 * @param {string} timeStr - Time string in format 'HH:mm' (24-hour)
 * @returns {boolean} True if the given datetime is strictly in the future.
 */
function isFutureDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return true; // Legacy fallback

  try {
    const scheduledDateTime = new Date(`${dateStr}T${timeStr}`);
    const currentDateTime = new Date();
    
    // Add a 1-minute buffer in case of slight client-server sync issues when creating exactly at current time
    return scheduledDateTime.getTime() >= (currentDateTime.getTime() - 60000);
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a given item has expired.
 * Handles legacy items without date/time fields safely.
 * @param {Object} item - Mongoose object or POJO containing date and time.
 * @returns {boolean} True if the item has expired.
 */
function isExpired(item) {
  if (!item.date) return false; // Legacy item, never expire
  
  // If time is missing (like legacy events), assume end of day 23:59
  const timeStr = item.time || '23:59';
  
  try {
    const scheduledDateTime = new Date(`${item.date}T${timeStr}`);
    const currentDateTime = new Date();
    
    // If current time is strictly greater than scheduled time, it's expired
    return currentDateTime.getTime() > scheduledDateTime.getTime();
  } catch (error) {
    return false; // Safely ignore parse errors on legacy formats
  }
}

module.exports = {
  isFutureDateTime,
  isExpired
};
