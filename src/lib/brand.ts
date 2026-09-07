function env(name: keyof ImportMetaEnv, fallback: string) {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const brand = {
  name: env("VITE_BRAND_NAME", "RG Business transport"),
  tagline: env("VITE_BRAND_TAGLINE", "Ship line"),
  mark: env("VITE_BRAND_MARK", "RG"),
  slug: env("VITE_BRAND_SLUG", "RG-Brothers"),
  logo: env("VITE_BRAND_LOGO", "/logo.png"),
  vocPrefix: env("VITE_VOC_PREFIX", "RGB"),
  emailPlaceholder: env("VITE_BRAND_EMAIL_PLACEHOLDER", "you@company.com"),
};

export function brandFile(suffix: string) {
  return `${brand.slug}-${suffix}`;
}
