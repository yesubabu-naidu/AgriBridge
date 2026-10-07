import React, { useState, useEffect } from 'react';
import { getUserInitial, hasValidAvatar } from '../utils/user';

/**
 * Circular user avatar component for AgriBridge.
 *
 * Requirements:
 * - If user has a valid uploaded avatar image, display that image.
 * - If image is null, empty, invalid, unavailable, or matches any placeholder/stock image,
 *   fall back to a circular avatar containing ONLY the uppercase first character of the user's name/username.
 * - Old/default placeholder images are NEVER displayed.
 * - Consistent circular design aligned with AgriBridge navbar theme.
 */
export default function UserAvatar({
  user,
  avatar,
  size = 32,
  fontSize,
  className = '',
  style = {},
  alt
}) {
  const avatarUrl = avatar !== undefined ? avatar : (user?.avatar || user?.avatar_url || null);
  const isValidUrl = hasValidAvatar(avatarUrl);
  const [imageFailed, setImageFailed] = useState(false);

  // Reset failure state if the avatar URL changes
  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const initial = getUserInitial(user);
  const computedFontSize = fontSize || `${Math.max(12, Math.round(size * 0.44))}px`;
  const displayName = typeof user === 'string' ? user : (user?.full_name || user?.username || 'User');
  const imageAlt = alt || `${displayName}'s avatar`;

  if (isValidUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl.trim()}
        alt={imageAlt}
        className={`rounded-circle flex-shrink-0 ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'cover',
          display: 'block',
          ...style
        }}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: computedFontSize,
        lineHeight: 1,
        userSelect: 'none',
        display: 'flex',
        ...style
      }}
      aria-label={`Avatar for ${displayName}`}
      role="img"
    >
      {initial}
    </div>
  );
}
