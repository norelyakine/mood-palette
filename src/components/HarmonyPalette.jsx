import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  hexToHSL,
  hslToHex,
  detectHarmony,
  generateHarmonySet,
  fetchHueWheel,
  getNearestHueHex
} from "../utils/colorUtils";
import layoutTemplates from "../utils/layoutTemplates";
import { HexColorPicker, HexColorInput } from "react-colorful";

export default function HarmonyPalette() {
  const [palette, setPalette] = useState([]);
  const [message, setMessage] = useState("");
  const [locked, setLocked] = useState({});
  const [activePicker, setActivePicker] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hueMap, setHueMap] = useState(null);

  // Refs to avoid stale state in key handlers
  const lockedRef = useRef(locked);
  const paletteRef = useRef(palette);
  const hueMapRef = useRef(hueMap);

  useEffect(() => { lockedRef.current = locked; }, [locked]);
  useEffect(() => { paletteRef.current = palette; }, [palette]);
  useEffect(() => { hueMapRef.current = hueMap; }, [hueMap]);

  const getGridClasses = ({ colStart, rowStart, colSpan, rowSpan }) =>
    [`col-start-${colStart}`, `row-start-${rowStart}`, `col-span-${colSpan}`, `row-span-${rowSpan}`].join(" ");

  const harmonyMessages = {
    Analogous: "You're making it lit — those hues are vibing together.",
    Complementary: "Nice combo! Opposites attract.",
    Triadic: "Bold move — this palette pops.",
    "Split-Complementary": "Balanced and expressive — you're onto something.",
  };

  const generatePalette = useCallback(async () => {
  const map = hueMapRef.current || (await fetchHueWheel());
  if (!hueMapRef.current) setHueMap(map);

  const baseHue = Math.floor(Math.random() * 360);
  const types = ["Analogous", "Complementary", "Triadic", "Split-Complementary"];
  const harmonyType = types[Math.floor(Math.random() * types.length)];
  const hueSet = generateHarmonySet(baseHue, harmonyType);

  const variants = Array(5)
    .fill(0)
    .map(() => ["bright", "soft", "deep", "muted"][Math.floor(Math.random() * 4)]);

  const locks = lockedRef.current;

  const hexSet = hueSet.map((h, i) =>
    locks[i] ? locks[i] : getNearestHueHex(h, map, variants[i])
  );

  const hasLocks = Object.keys(locks).length > 0;

  let nextPalette;
  if (paletteRef.current.length > 0) {
    // If there are no locks, allow a fresh layout; otherwise preserve layout
    const layout = !hasLocks
      ? layoutTemplates[Math.floor(Math.random() * layoutTemplates.length)]
      : paletteRef.current.map(({ colStart, rowStart, colSpan, rowSpan }) => ({
          colStart, rowStart, colSpan, rowSpan
        }));

    nextPalette = layout.map((layoutItem, i) => ({
      ...layoutItem,
      color: locks[i] ? locks[i] : hexSet[i],
    }));
  } else {
    // First time: pick a random layout
    const layout = layoutTemplates[Math.floor(Math.random() * layoutTemplates.length)];
    nextPalette = layout.map((layoutItem, i) => ({
      ...layoutItem,
      color: hexSet[i],
    }));
  }

  setPalette(nextPalette);
  setMessage("");
  setActivePicker(null);
  setCopiedIndex(null);
}, []);


  const toggleLock = (index) => {
    setLocked((prev) => {
      const next = { ...prev };
      if (next[index]) {
        delete next[index];
      } else {
        next[index] = paletteRef.current[index].color;
      }
      lockedRef.current = next; // sync for Enter
      return next;
    });
  };

  const unlockAll = () => {
    lockedRef.current = {};
    setLocked({});
  };

  const tweakColor = (index) => {
    const updated = paletteRef.current.map((item, i) => {
      if (i !== index) return item;
      const { h, s, l } = hexToHSL(item.color);
      const hex = hslToHex((h + 15) % 360, s, l);
      if (lockedRef.current[index]) {
        const nextLocked = { ...lockedRef.current, [index]: hex };
        lockedRef.current = nextLocked;
        setLocked(nextLocked);
      }
      return { ...item, color: hex };
    });
    paletteRef.current = updated;
    setPalette(updated);
    const harmony = detectHarmony(updated);
    setMessage(harmonyMessages[harmony] || "Still a bit chaotic — try another tweak!");
  };

  const handleColorChange = (index, hex) => {
    // Lock immediately and update refs so Enter sees it
    const nextLocked = { ...lockedRef.current, [index]: hex };
    lockedRef.current = nextLocked;
    setLocked(nextLocked);

    const updated = paletteRef.current.map((item, i) =>
      i === index ? { ...item, color: hex } : item
    );
    paletteRef.current = updated;
    setPalette(updated);
  };

  const handleCopy = async (hex, i) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {}
  };

  useEffect(() => {
    generatePalette();

    const onKey = (e) => {
      if (e.key === "Enter") {
        generatePalette();
      }
    };
    window.addEventListener("keyup", onKey);
    return () => window.removeEventListener("keyup", onKey);
  }, [generatePalette]);

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold text-center mb-2">Harmony Mode</h1>

      {/* Controls row */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={unlockAll}
          className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          title="Unlock all tiles"
        >
          🔓 Unlock all
        </button>

        <button
          onClick={generatePalette}
          className="text-2xl text-gray-700 hover:text-black transition"
          title="Generate New Palette"
        >
          🔄
        </button>
      </div>

      <div className="grid grid-cols-4 grid-rows-2 gap-2 w-full min-h-[400px]">
        {palette.map((item, i) => (
          <div
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setActivePicker(i);
            }}
            className={`rounded ${getGridClasses(item)} relative group cursor-pointer border border-white`}
            style={{ backgroundColor: item.color }}
          >
            {/* copyable hex */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(item.color, i);
              }}
              className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
              title="Click to copy"
            >
              {copiedIndex === i ? "Copied!" : item.color}
            </span>

            {/* tweak */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                tweakColor(i);
              }}
              className="absolute top-2 right-2 text-xs bg-white text-gray-800 px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition"
            >
              Tweak
            </span>

            {/* lock, stays visible when locked */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleLock(i);
              }}
              className={
                `absolute top-2 left-2 text-xs bg-white text-gray-800 px-2 py-1 rounded shadow cursor-pointer transition ` +
                (locked[i]
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100")
              }
              title={locked[i] ? "Unlock" : "Lock"}
            >
              {locked[i] ? "🔒" : "🔓"}
            </span>
          </div>
        ))}

        {activePicker != null && (
          <div
            onClick={() => setActivePicker(null)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-4 rounded shadow-lg"
            >
              <HexColorPicker
                color={palette[activePicker].color}
                onChange={(hex) => handleColorChange(activePicker, hex)}
              />
              <div className="mt-2 flex items-center space-x-2">
                <HexColorInput
                  color={palette[activePicker].color}
                  onChange={(hex) => handleColorChange(activePicker, hex)}
                  className="border p-1 rounded flex-1"
                />
                <button
                  onClick={() => setActivePicker(null)}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {message && <div className="mt-4 text-center text-green-600 italic">{message}</div>}

      <div className="mt-4 text-center text-sm text-gray-600 italic">
        {detectHarmony(palette) !== "Mixed / Unclassified"
          ? `Harmony: ${detectHarmony(palette)}`
          : "Harmony: Unclassified"}
      </div>
    </div>
  );
}
