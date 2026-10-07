/**
 * Returns the first character of the user's name or username in uppercase.
 * Accepts either a string or a user object containing full_name, name, username, or email.
 * Trims whitespace first and dynamically falls back to 'U' if no name is available.
 *
 * Examples:
 * - "siva koteswara rao" -> "S"
 * - "Charan Kumar" -> "C"
 * - "ravi" -> "R"
 *
 * @param {string|object|null|undefined} userOrName
 * @returns {string} Single uppercase character
 */
export function getUserInitial(userOrName) {
  let name = '';
  if (typeof userOrName === 'string') {
    name = userOrName;
  } else if (userOrName && typeof userOrName === 'object') {
    name =
      userOrName.full_name ||
      userOrName.fullName ||
      userOrName.name ||
      userOrName.username ||
      userOrName.email ||
      '';
  }
  if (!name || typeof name !== 'string') return 'U';
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  return trimmed.charAt(0).toUpperCase();
}

/**
 * Checks if a given avatar URL is a default, placeholder, stock, or fallback image.
 *
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isPlaceholderAvatar(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return true;

  // Filter out empty or common placeholder / stock patterns
  if (
    trimmed.includes('images.unsplash.com/photo-1534528741775') ||
    trimmed.includes('images.unsplash.com/photo-1507003211169') ||
    trimmed.includes('images.unsplash.com/photo-150064876779') ||
    trimmed.includes('images.unsplash.com/photo-1472099645785') ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('default-user') ||
    trimmed.includes('default_user') ||
    trimmed.includes('default-avatar') ||
    trimmed.includes('default_avatar') ||
    trimmed.includes('avatar-placeholder') ||
    trimmed.includes('avatar_placeholder') ||
    trimmed.includes('placeholder')
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether a given avatar string is a valid uploaded user avatar image.
 * Returns false if the URL is null, empty, invalid, or matches a default/placeholder.
 *
 * @param {string|null|undefined} avatarUrl
 * @returns {boolean}
 */
export function hasValidAvatar(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') return false;
  const trimmed = avatarUrl.trim();
  if (!trimmed) return false;
  if (isPlaceholderAvatar(trimmed)) return false;
  return true;
}

/**
 * Safely extracts a valid uploaded avatar URL from a user object or returns null.
 *
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export function getUserAvatarUrl(user) {
  if (!user || typeof user !== 'object') return null;
  const candidate = user.avatar || user.avatar_url;
  if (!candidate || typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  return hasValidAvatar(trimmed) ? trimmed : null;
}

