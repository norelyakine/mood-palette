import { rtdb } from "../firebase";
import { ref, get, child } from "firebase/database";

export const hexToHSL = (hex) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return { h: 0, s: 0, l: 0 };
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${f(0).toString(16).padStart(2, '0')}${f(8).toString(16).padStart(2, '0')}${f(4).toString(16).padStart(2, '0')}`;
};

export const detectHarmony = (colors) => {
  const hues = colors.map(c => hexToHSL(c.color).h).sort((a, b) => a - b);
  const diffs = hues.map((h, i) => (hues[(i + 1) % hues.length] - h + 360) % 360);
  const closeTo = (target, tolerance) => diffs.filter(d => Math.abs(d - target) < tolerance).length;
  if (closeTo(30, 20) >= 3) return "Analogous";
  if (closeTo(180, 30) >= 1) return "Complementary";
  if (closeTo(120, 30) >= 2) return "Triadic";
  if (closeTo(150, 30) >= 2) return "Split-Complementary";
  return "Mixed / Unclassified";
};

export const clusterByHue = (pool, baseHue, range = 30) => {
  const hslPool = pool.map(hex => ({ hex, ...hexToHSL(hex) }));
  const cluster = hslPool.filter(({ h }) => {
    const diff = Math.abs(h - baseHue);
    return diff <= range || diff >= 360 - range;
  });
  return cluster.map(({ hex }) => hex);
};

export const generateHarmonySet = (baseHue, type) => {
  switch (type) {
    case "Analogous":
      return [baseHue, (baseHue + 30) % 360, (baseHue + 60) % 360, (baseHue + 90) % 360, (baseHue + 120) % 360];
    case "Complementary":
      return [baseHue, (baseHue + 180) % 360, (baseHue + 160) % 360, (baseHue + 200) % 360, (baseHue + 20) % 360];
    case "Triadic":
      return [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360, (baseHue + 60) % 360, (baseHue + 180) % 360];
    case "Split-Complementary":
      return [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360, (baseHue + 30) % 360, (baseHue + 330) % 360];
    default:
      return [baseHue, (baseHue + 72) % 360, (baseHue + 144) % 360, (baseHue + 216) % 360, (baseHue + 288) % 360];
  }
};

export const fetchHueWheel = async () => {
  const dbRef = ref(rtdb);
  const snapshot = await get(child(dbRef, "hueWheel"));
  if (!snapshot.exists()) return {};

  const raw = snapshot.val();
  const hueMap = {};
  Object.keys(raw).forEach(h => {
    hueMap[parseInt(h)] = raw[h].variants;
  });
  return hueMap; 
};


export const getNearestHueHex = (targetHue, hueMap, variant = "bright") => {
  const availableHues = Object.keys(hueMap).map(Number);
  const closest = availableHues.reduce((a, b) =>
    Math.abs(b - targetHue) < Math.abs(a - targetHue) ? b : a
  );
  const variants = hueMap[closest];
  return variants?.[variant] || variants?.bright || "#cccccc";
};



export const getVariant = (hex, variant = "soft") => {
  const { h, s, l } = hexToHSL(hex);
  switch (variant) {
    case "soft": return hslToHex(h, Math.max(s - 30, 40), Math.min(l + 10, 70));
    case "deep": return hslToHex(h, s, Math.max(l - 20, 20));
    case "bright": return hslToHex(h, 100, 50);
    default: return hex;
  }
};
