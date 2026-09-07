/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BRAND_NAME?: string;
  readonly VITE_BRAND_TAGLINE?: string;
  readonly VITE_BRAND_MARK?: string;
  readonly VITE_BRAND_SLUG?: string;
  readonly VITE_BRAND_LOGO?: string;
  readonly VITE_VOC_PREFIX?: string;
  readonly VITE_BRAND_EMAIL_PLACEHOLDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
