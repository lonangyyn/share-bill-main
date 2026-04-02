import { DEFAULT_AVATAR_URL } from "./default-avatar";

export function getAvatarUrl(seed?: string) {
  if (!seed) return DEFAULT_AVATAR_URL;

  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}`;
}
