function env(name: keyof ImportMetaEnv, fallback: string) {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const DEFAULT_THEME_COLOR = "#1b5a9d";

function parseHex(value: string) {
  const hex = value.trim().replace(/^['"]|['"]$/g, "").replace(/^#/, "");
  if (!/^[0-9a-f]{3}$/i.test(hex) && !/^[0-9a-f]{6}$/i.test(hex)) {
    return DEFAULT_THEME_COLOR;
  }
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  return `#${full.toLowerCase()}`;
}

function hexToHsl(hex: string) {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export const brand = {
  name: env("VITE_BRAND_NAME", "RG Business transport"),
  tagline: env("VITE_BRAND_TAGLINE", "Ship line"),
  mark: env("VITE_BRAND_MARK", "RG"),
  slug: env("VITE_BRAND_SLUG", "RG-Brothers"),
  logo: env("VITE_BRAND_LOGO", "/logo.png"),
  vocPrefix: env("VITE_VOC_PREFIX", "RGB"),
  emailPlaceholder: env("VITE_BRAND_EMAIL_PLACEHOLDER", "you@company.com"),
  themeColor: parseHex(env("VITE_THEME_COLOR", DEFAULT_THEME_COLOR)),
};

export const brandHsl = hexToHsl(brand.themeColor);

export function applyBrandTheme() {
  const root = document.documentElement;
  root.style.setProperty("--brand-h", String(brandHsl.h));
  root.style.setProperty("--brand-s", `${brandHsl.s}%`);
  root.style.setProperty("--brand-l", `${brandHsl.l}%`);

  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = brand.themeColor;
}

export function brandFile(suffix: string) {
  return `${brand.slug}-${suffix}`;
}
