// src/components/MyPalettes.js
import React, { useEffect, useState } from "react";
import { rtdb, auth } from "../firebase";
import { ref, get, child } from "firebase/database";

export default function MyPalettes() {
  const [palettes, setPalettes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPalettes() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `users/${user.uid}/palettes`));

      if (snapshot.exists()) {
        setPalettes(snapshot.val());
      } else {
        setPalettes({});
      }

      setLoading(false);
    }

    fetchPalettes();
  }, []);

  if (loading) return <p>Loading palettes...</p>;

  return (
    <div className="p-6 bg-white rounded shadow-md w-full max-w-lg mx-auto mt-6">
      <h1 className="text-2xl font-bold mb-4">My Saved Palettes</h1>

      {Object.keys(palettes).length === 0 ? (
        <p>No palettes saved yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(palettes).map(([id, palette]) => (
            <div
              key={id}
              className="p-4 border rounded shadow-sm bg-gray-50"
            >
              <h2 className="font-semibold mb-2">{palette.mood} Palette</h2>
              <div className="flex gap-2">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 rounded shadow"
                    style={{ backgroundColor: color }}
                    title={color}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
