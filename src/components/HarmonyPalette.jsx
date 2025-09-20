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
import { rtdb, auth } from "../firebase";
import { ref, push, get, child, set } from "firebase/database";
import {addPaletteToCollection, createCollection} from "../firebaseSetUp";

export default function HarmonyPalette() {
  const [palette, setPalette] = useState([]);
  const [message, setMessage] = useState("");
  const [locked, setLocked] = useState({});
  const [activePicker, setActivePicker] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hueMap, setHueMap] = useState(null);
  const [paletteKey, setPaletteKey] = useState(0);
  const lockedRef = useRef(locked);
  const paletteRef = useRef(palette);
  const hueMapRef = useRef(hueMap);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collections, setCollections] = useState({});
  const [newCollectionName, setNewCollectionName] = useState("");


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
  setPaletteKey((k) => k + 1);

  setMessage("");
  setActivePicker(null);
  setCopiedIndex(null);
}, []);
const openSaveModal = async () => {
  const user = auth.currentUser;
  if (!user) return;
  const snap = await get(child(ref(rtdb), `users/${user.uid}/collections`));
  setCollections(snap.exists() ? snap.val() : {});
  setShowSaveModal(true);
};

const savePalette = () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Log in to save.");
    return;
  }

  const pRef = ref(rtdb, `users/${user.uid}/palettes`);
  const newRef = push(pRef);

  set(newRef, {
    type: "harmony",
    colors: palette.map((c) => c.color),
    createdAt: Date.now(),
  }).then(() => setMessage("Harmony palette saved, locked in perfect balance!"));
    setTimeout(() => setMessage(""), 600); 
};


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
    <>
    <div className="h-full px-6 relative">
      <h1 className="text-2xl font-bold text-center mb-3 ">Harmony Mode</h1>
        {message && (
        <div className="fixed top-19 right-4 bg-amber-400 bg-opacity-55 text-orange-900 px-4 py-2 rounded shadow z-50">
            {message}
        </div>
        )}

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
        <button
        onClick={openSaveModal}
        className="text-xl text-gray-700 hover:text-black transition"
        title="Save Palette"
        >
        💾
        </button>

      </div>

   

      <div className="grid grid-cols-4 grid-rows-2 gap-2 w-full  h-[60vh]">
       {palette.map((item, i) => {
        const isLocked = !!locked[i];
        return (
            <div
            key={`${paletteKey}-${i}`}
            className={`rounded cursor-pointer relative group ${getGridClasses(item)} border border-white
                ${!isLocked ? "opacity-0 animate-fade-in" : ""}`}
            style={{
                backgroundColor: item.color,
                animationDelay: !isLocked ? `${i * 100}ms` : undefined,
                animationFillMode: !isLocked ? "forwards" : undefined,
            }}
            onClick={(e) => {
                e.stopPropagation();
                setActivePicker(i);
            }}
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

            {/* lock */}
            <span
                onClick={(e) => {
                e.stopPropagation();
                toggleLock(i);
                }}
                className={
                `absolute top-2 left-2 text-xs bg-white text-gray-800 px-2 py-1 rounded shadow cursor-pointer transition ` +
                (isLocked ? "opacity-100" : "opacity-0 group-hover:opacity-100")
                }
                title={isLocked ? "Unlock" : "Lock"}
            >
                {isLocked ? "🔒" : "🔓"}
            </span>
            </div>
        );
        })}


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
   <p className="mt-3 text-center text-sm text-gray-500 italic">
        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> to generate a new palette
     </p>
      {message && <div className="mt-4 text-center text-green-600 italic">{message}</div>}

      <div className="mt-4 text-center text-sm text-gray-600 italic">
        {detectHarmony(palette) !== "Mixed / Unclassified"
          ? `Harmony: ${detectHarmony(palette)}`
          : "Harmony: Unclassified"}
      </div>
    </div>

    {showSaveModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
        <h3 className="text-lg font-bold mb-3">Save Palette</h3>

        {/* Existing collections */}
        {Object.keys(collections).length > 0 ? (
          <div className="space-y-2 mb-4">
            {Object.entries(collections).map(([id, col]) => (
              <button
                key={id}
                onClick={async () => {
                  const user = auth.currentUser;
                  const pRef = ref(rtdb, `users/${user.uid}/palettes`);
                  const newRef = push(pRef);
                  await set(newRef, {
                    type: "harmony",
                    colors: palette.map((c) => c.color),
                    createdAt: Date.now(),
                  });
                  await addPaletteToCollection(id, newRef.key);
                  setShowSaveModal(false);
                  setMessage(`Saved to ${col.name}`);
                  setTimeout(() => setMessage(""), 1500);
                }}
                className="w-full text-left px-3 py-2 rounded border hover:bg-gray-100"
              >
                {col.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No collections yet.</p>
        )}

        {/* Create new collection */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="New collection name"
            className="flex-1 border rounded px-2 py-1"
          />
          <button
            onClick={async () => {
              if (!newCollectionName.trim()) return;
              const id = await createCollection(newCollectionName.trim());
              const user = auth.currentUser;
              const pRef = ref(rtdb, `users/${user.uid}/palettes`);
              const newRef = push(pRef);
              await set(newRef, {
                type: "harmony",
                colors: palette.map((c) => c.color),
                createdAt: Date.now(),
              });
              await addPaletteToCollection(id, newRef.key);
              setShowSaveModal(false);
              setNewCollectionName("");
              setMessage("Palette saved to new collection!");
              setTimeout(() => setMessage(""), 1500);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Create & Save
          </button>
        </div>

        <button
          onClick={() => setShowSaveModal(false)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</>
  );
}
