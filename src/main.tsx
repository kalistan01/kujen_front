import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyBrandTheme, brand } from "./lib/brand";
import "./index.css";

applyBrandTheme();
document.title = `${brand.name} — ${brand.tagline}`;
const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
if (icon) icon.href = brand.logo;

createRoot(document.getElementById("root")!).render(<App />);
