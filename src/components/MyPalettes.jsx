// src/components/MyPalettes.js
import React, { useEffect, useState, useMemo } from "react";
import { rtdb, auth } from "../firebase";
import { ref, get, child } from "firebase/database";
import { createCollection } from "../firebaseSetUp";

function normalizeMoodLabel(mood) {
  if (!mood || typeof mood !== "string") return "Unknown";
  const trimmed = mood.trim();
  if (!trimmed) return "Unknown";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function cleanHex(value) {
  const s = String(value).trim().replace(/^['"]|['"]$/g, ""); // remove stray quotes
  const valid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
  return valid ? s : null;
}

function sanitizePalette([id, p]) {
  const colors = Array.isArray(p.colors)
    ? p.colors
        .map(cleanHex)
        .filter(Boolean)
    : [];

  const type = p.type === "harmony" ? "harmony" : "mood";
  const mood = type === "mood" ? normalizeMoodLabel(p.mood) : null;
  const createdAt = typeof p.createdAt === "number" ? p.createdAt : 0;

  return {
    id,
    type,
    mood,
    colors,
    createdAt,
    isValid: colors.length > 0,
  };
}

export default function MyPalettes() {
  const [palettes, setPalettes] = useState({});
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState({});

  useEffect(() => {
    async function fetchData() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const dbRef = ref(rtdb);

      const palettesSnap = await get(child(dbRef, `users/${user.uid}/palettes`));
      setPalettes(palettesSnap.exists() ? palettesSnap.val() : {});

      const collectionsSnap = await get(child(dbRef, `users/${user.uid}/collections`));
      setCollections(collectionsSnap.exists() ? collectionsSnap.val() : {});

      setLoading(false);
    }

    fetchData();
  }, []);

  const grouped = useMemo(() => {
    const acc = {};
    Object.entries(palettes)
      .map(sanitizePalette)
      .filter((p) => p.isValid)
      .forEach((p) => {
        const key = p.type === "harmony" ? "Harmony" : p.mood || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
      });

    Object.keys(acc).forEach((k) => {
      acc[k].sort((a, b) => b.createdAt - a.createdAt);
    });

    return acc;
  }, [palettes]);

  const sortedGroups = useMemo(() => {
    return Object.entries(grouped).sort((a, b) => {
      const lenDiff = b[1].length - a[1].length;
      if (lenDiff !== 0) return lenDiff;
      return a[0].localeCompare(b[0]);
    });
  }, [grouped]);

  if (loading) return <p>Loading palettes...</p>;

  return (
<div className="h-[80vh] overflow-y-auto scroll-smooth px-3 bg-gray-50 w-full mx-auto flex flex-col">
      <button
        onClick={async () => {
          const name = prompt("Collection name?");
          if (name) {
            const id = await createCollection(name);
            const snapshot = await get(
              child(ref(rtdb), `users/${auth.currentUser.uid}/collections`)
            );
            setCollections(snapshot.exists() ? snapshot.val() : {});
            console.log("Created collection:", id);
          }
        }}
        className="mb-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        ➕ New Collection
      </button>

      <h2 className="text-xl font-bold mb-4">My Collections</h2>
      {Object.keys(collections).length === 0 ? (
        <p className="text-gray-500 mb-6">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(collections).map(([id, collection]) => {
            const previewPalette =
              Array.isArray(collection.paletteIds) &&
              collection.paletteIds.length > 0
                ? palettes[collection.paletteIds[0]]
                : null;

            const previewColors = Array.isArray(previewPalette?.colors)
              ? previewPalette.colors.map(cleanHex).filter(Boolean)
              : [];

            return (
              <div
                key={id}
                className="rounded-lg shadow hover:shadow-md transition cursor-pointer bg-white overflow-hidden"
                onClick={() => console.log("Open collection:", collection.name)}
              >
                <div className="flex h-20">
                  {previewColors.length > 0 ? (
                    previewColors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))
                  ) : (
                    <div className="flex-1 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      Empty
                    </div>
                  )}
                </div>

                <div className="p-3 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">{collection.name}</span>
                  <span className="text-xs text-gray-500">
                    {(collection.paletteIds && collection.paletteIds.length) || 0} saved
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">My Saved Palettes</h1>

      {sortedGroups.length === 0 ? (
        <p className="text-gray-500">No palettes saved yet.</p>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedGroups.map(([groupName, items]) => {
            const MAX_THUMBS = 4;
            const thumbs = items.slice(0, MAX_THUMBS);
            const overflow = Math.max(0, items.length - MAX_THUMBS);

           return (
            <div
              key={groupName}
              className="bg-white min-h-[120px] rounded-lg shadow hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Color tiles */}
              <div className="flex h-24 w-full">
                {items[0].colors.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Info bar */}
              <div className="flex justify-between items-center px-3 py-2">
                <span className="font-semibold text-gray-700">{groupName}</span>
                <span className="text-xs text-gray-500">{items.length} saved</span>
              </div>
            </div>
          );

          })}
        </div>
      )}
    </div>
  );
}
