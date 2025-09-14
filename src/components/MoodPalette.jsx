import React, { useState, useEffect } from "react";
import { rtdb } from "../firebase"; 
import { ref, set, get, child, push } from "firebase/database";
import { auth } from "../firebase";  // 👈 import auth to know the logged-in user

export default function MoodPalette() {
  const [selectedMood, setSelectedMood] = useState("");
  const [moodColors, setMoodColors] = useState({});
  const [loading, setLoading] = useState(true);

  // Initial data
  const initialData = {
    moods: {
      Calm: { colors: ["#A7C7E7", "#B0D0D3", "#C4E0E5", "#D0E6F1", "#E6F2F8"] },
      Energetic: { colors: ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6F91"] },
      Luxury: { colors: ["#2C2A4A", "#5E548E", "#9F86C0", "#D9B8C4", "#F5F5F5"] }
    }
  };

  useEffect(() => {
    const dbRef = ref(rtdb); 

    get(child(dbRef, "/moods")).then((snapshot) => {
      if (!snapshot.exists()) {
        set(dbRef, initialData);
      }

      get(child(dbRef, "/moods")).then((snap) => {
        const moods = {};
        if (snap.exists()) {
          const data = snap.val();
          for (let moodName in data) {
            moods[moodName] = data[moodName].colors;
          }
          setMoodColors(moods);
          if (!selectedMood) setSelectedMood(Object.keys(moods)[0]);
        }
        setLoading(false);
      });
    });
  }, [selectedMood]);

  // 👇 Save selected palette to user's account
  const savePalette = () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must log in to save palettes!");
      return;
    }

    const paletteRef = ref(rtdb, `users/${user.uid}/palettes`);
    const newPaletteRef = push(paletteRef); // generates a unique id

    set(newPaletteRef, {
      mood: selectedMood,
      colors: moodColors[selectedMood],
      createdAt: Date.now()
    })
      .then(() => {
        alert("🎉 Palette saved!");
      })
      .catch((err) => {
        console.error("Error saving palette:", err);
      });
  };

  if (loading) return <p>Loading moods...</p>;

  return (
    <div className="p-6 bg-white rounded shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-4">Dynamic Mood Palette</h1>

      {/* Mood selector */}
      <select
        className="mb-4 p-2 border rounded w-full"
        value={selectedMood}
        onChange={(e) => setSelectedMood(e.target.value)}
      >
        {Object.keys(moodColors).map((mood) => (
          <option key={mood} value={mood}>
            {mood}
          </option>
        ))}
      </select>

      {/* Palette preview */}
      <div className="flex gap-2 mb-4">
        {moodColors[selectedMood]?.map((color, index) => (
          <div
            key={index}
            className="w-12 h-12 rounded shadow"
            style={{ backgroundColor: color }}
            title={color}
          ></div>
        ))}
      </div>

      {/* 👇 New Save button */}
      <button
        onClick={savePalette}
        className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
      >
        Save Palette
      </button>
    </div>
  );
}
