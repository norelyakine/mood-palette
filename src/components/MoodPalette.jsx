import React, { useState, useEffect } from "react";
import { rtdb } from "../firebase";
import { ref, push, set } from "firebase/database";
import { auth } from "../firebase";
import {addPaletteToCollection} from "../firebaseSetUp";
import layoutTemplates from "../utils/layoutTemplates";

const MOOD_CONFIG = {
  Calm: {
    hueSegments: [[160, 200], [200, 240], [120, 160]],
    satRange: [20, 40],
    lightRange: [70, 90]
  },
  Energetic: {
    hueSegments: [[0, 40], [300, 360], [40, 80]],
    satRange: [70, 100],
    lightRange: [45, 70]
  },
  Luxury: {
    hueSegments: [[250, 290], [30, 60], [330, 360]],
    satRange: [30, 60],
    lightRange: [30, 60]
  },
  Cozy: {
    hueSegments: [[20, 50], [10, 25], [40, 65]],
    satRange: [50, 80],
    lightRange: [50, 80]
  },
  Tropical: {
    hueSegments: [[120, 180], [0, 60], [180, 240]],
    satRange: [60, 100],
    lightRange: [50, 75]
  },
  Dreamy: {
    hueSegments: [[200, 260], [260, 300], [150, 200]],
    satRange: [25, 50],
    lightRange: [70, 95]
  },
};

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrapHue = (h) => ((h % 360) + 360) % 360;

const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

function generateMoodPaletteColors(mood) {
  const { hueSegments, satRange, lightRange } = MOOD_CONFIG[mood];
  const colors = [];
  while (colors.length < 5) {
    const seg = hueSegments[Math.floor(Math.random() * hueSegments.length)];
    const h = rand(seg[0], seg[1]);
    const s = rand(satRange[0], satRange[1]);
    const l = rand(lightRange[0], lightRange[1]);
    colors.push(hslToHex(wrapHue(h), clamp(s, 0, 100), clamp(l, 0, 100)));
  }
  return colors;
}

const normalizeLayoutItem = (item) => {
  const maxCols = 4, maxRows = 2;
  let { colStart, rowStart, colSpan, rowSpan } = item;
  colSpan = clamp(colSpan, 1, maxCols);
  rowSpan = clamp(rowSpan, 1, maxRows);
  colStart = clamp(colStart, 1, maxCols - colSpan + 1);
  rowStart = clamp(rowStart, 1, maxRows - rowSpan + 1);
  return { colStart, rowStart, colSpan, rowSpan };
};

const getGridClasses = ({ colStart, rowStart, colSpan, rowSpan }) =>
  [`col-start-${colStart}`, `row-start-${rowStart}`, `col-span-${colSpan}`, `row-span-${rowSpan}`].join(" ");

export default function MoodPalette() {
  const [selectedMood, setSelectedMood] = useState("Calm");
  const [currentPalette, setCurrentPalette] = useState([]);
  const [message, setMessage] = useState("");
  const [paletteKey, setPaletteKey] = useState(0);

  const moods = Object.keys(MOOD_CONFIG);

  const generatePalette = () => {
    const colors = generateMoodPaletteColors(selectedMood);
    const layout = layoutTemplates[
      Math.floor(Math.random() * layoutTemplates.length)
    ].map(normalizeLayoutItem);

    const newPalette = layout.map((item, i) => ({
      color: colors[i],
      ...item
    }));

    setCurrentPalette(newPalette);
    setPaletteKey((k) => k + 1);
  };

  useEffect(generatePalette, [selectedMood]);

  useEffect(() => {
    const onKey = (e) => e.key === "Enter" && generatePalette();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedMood]);

  const copyColor = (hex) => {
    navigator.clipboard.writeText(hex);
    setMessage(`Copied ${hex}`);
    setTimeout(() => setMessage(""), 1500);
  };

  const savePalette = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Log in to save.");
    return;
  }

  const pRef = ref(rtdb, `users/${user.uid}/palettes`);
  const newRef = push(pRef);

    await set(newRef, {
    type: "mood",
    mood: selectedMood,
    colors: currentPalette.map((c) => c.color),
    createdAt: Date.now(),
  })


  const collectionId = prompt("Save to which collection ID? (leave blank to skip)");
  if (collectionId) {
    await addPaletteToCollection(collectionId, newRef.key);
  }

  setMessage("Mood palette saved!");
  setTimeout(() => setMessage(""), 600);
};


  return (
  <div className="h-full w-full min-h-screen bg-gray-100 py-1 px-2 overflow-x-hidden">
    {message && (
      <div className="fixed top-19 right-4 bg-opacity-50 bg-amber-400 text-orange-700 px-4 py-2 rounded shadow z-50">
        {message}
      </div>
    )}

   <h1 className="text-2xl font-bold -mt-3 mb-1 text-center">Mood Palettes</h1>

{/* Selector + icons in one row */}
<div className="flex items-center gap-2 mb-4">
  <select
    className="flex-1 py-2 px-3 border-b-slate-500 border-b bg-transparent text-md"
    value={selectedMood}
    onChange={(e) => setSelectedMood(e.target.value)}
  >
    {moods.map((m) => (
      <option key={m} value={m}>
        {m}
      </option>
    ))}
  </select>

  <button
    onClick={generatePalette}
    className="bg-none  "
    title="Regenerate Palette"
  >
    🔄
  </button>
  <button
    onClick={savePalette}
    className=" bg-none"
    title="Save Palette"
  >
    💾
  </button>
</div>

{/* Palette grid */}
<div className="grid grid-cols-4 grid-rows-2 gap-2 mb-4 h-[60vh]">
  {currentPalette.map((tile, i) => (
    <div
      key={`${paletteKey}-${i}`}
      className={`rounded cursor-pointer relative group opacity-0 animate-fade-in ${getGridClasses(tile)} h-full w-full`}
      style={{
        backgroundColor: tile.color,
        animationDelay: `${i * 100}ms`,
        animationFillMode: "forwards",
      }}
      onClick={() => copyColor(tile.color)}
    >
      <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
        {tile.color}
      </span>
    </div>
  ))}
</div>
 <p className="mb-4 text-center text-sm text-gray-500 italic">
  Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> to generate a new palette
</p>
  </div>
);

}
