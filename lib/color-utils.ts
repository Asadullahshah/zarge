// Central color helper shared by the product detail page and product cards.
// Resolves a color VALUE (which stays a human name everywhere — variants, cart,
// orders, SKUs) into a CSS hex for swatch rendering.

const COLOR_MAP: Record<string, string> = {
  white: '#FFFFFF',
  black: '#000000',
  'navy blue': '#001f3f',
  navy: '#001f3f',
  beige: '#F5F5DC',
  cream: '#FFFDD0',
  brown: '#8B4513',
  grey: '#808080',
  gray: '#808080',
  maroon: '#800000',
  burgundy: '#800020',
  olive: '#808000',
  khaki: '#C3B091',
  'pastel pink': '#FFD1DC',
  'pastel blue': '#AEC6CF',
  'pastel green': '#B5EAD7',
  'pastel yellow': '#FFF9C4',
  peach: '#FFCBA4',
  'sky blue': '#87CEEB',
  turquoise: '#40E0D0',
  purple: '#800080',
  red: '#FF0000',
  green: '#008000',
  yellow: '#FFFF00',
  orange: '#FFA500',
  pink: '#FFC0CB',
  'multi color': '#FFD700',
  printed: '#FFD700',
}

const DEFAULT_SWATCH = '#808080'

/** True if the string is a valid CSS hex color (#rgb or #rrggbb). */
export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

/**
 * Resolve a color value to a CSS hex for a swatch.
 * Priority: per-product swatch map → hex passthrough → known-name dictionary → default grey.
 */
export function getColorHex(
  colorName: string,
  swatchMap?: Record<string, string> | null
): string {
  if (!colorName) return DEFAULT_SWATCH
  const raw = colorName.trim()

  // 1. Per-product swatch map (exact, then case-insensitive)
  if (swatchMap && typeof swatchMap === 'object') {
    if (swatchMap[raw] && isHexColor(swatchMap[raw])) return swatchMap[raw]
    const key = Object.keys(swatchMap).find((k) => k.toLowerCase() === raw.toLowerCase())
    if (key && isHexColor(swatchMap[key])) return swatchMap[key]
  }

  // 2. The value itself is a hex code (supports typing "#8B5E3C" directly)
  if (isHexColor(raw)) return raw

  // 3. Known color-name dictionary
  return COLOR_MAP[raw.toLowerCase()] || DEFAULT_SWATCH
}
