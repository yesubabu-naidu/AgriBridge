/**
 * Returns the first character of the user's full_name in uppercase.
 * Trims whitespace first and safely falls back to 'U' if full_name is unavailable.
 *
 * @param {string|null|undefined} fullName
 * @returns {string} Single uppercase character
 */
export function getUserInitial(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'U';
  const trimmed = fullName.trim();
  if (!trimmed) return 'U';
  return trimmed.charAt(0).toUpperCase();
}
