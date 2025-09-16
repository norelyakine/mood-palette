import React, { useState, useEffect } from "react";
import { rtdb } from "../firebase"; 
import { ref, set, get, child, push } from "firebase/database";
import { auth } from "../firebase";  

export default function MoodPalette() {
  const [selectedMood, setSelectedMood] = useState("");
  const [moodColors, setMoodColors] = useState({});
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  // Initial data
        const initialData = {
        moods: {
            Calm: [
            ["#A7C7E7", "#B0D0D3", "#C4E0E5", "#D0E6F1", "#E6F2F8"],
            ["#B8D8C0", "#CFE8D6", "#E2F3E8", "#A8D5BA", "#D0E6C8"],
            ["#D3E5F0", "#AFCBD9", "#88B3C8", "#BEDDE8", "#E3F0F8"]
            ],
            Energetic: [
            ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6F91"],
            ["#FF3D00", "#FFEB3B", "#00C853", "#2979FF", "#F50057"],
            ["#FF1744", "#FFC107", "#00E676", "#2962FF", "#FF4081"]
            ],
            Luxury: [
            ["#2C2A4A", "#5E548E", "#9F86C0", "#D9B8C4", "#F5F5F5"],
            ["#1F1B38", "#4F4C7F", "#927FBF", "#D1A6C1", "#EFEFEF"],
            ["#3A2C5A", "#7A6EBF", "#C4A4E3", "#E8D0DF", "#FFFFFF"]
            ],
            Cozy: [
            ["#FFB347", "#FFCC99", "#FFD8B1", "#FFE4C4", "#FFF0E0"],
            ["#F5A623", "#FBBF50", "#FDE2B4", "#FFEAD2", "#FFF7E0"],
            ["#FF6F61", "#FF9E80", "#FFCAB0", "#FFE5D0", "#FFF2E0"]
            ],
            Tropical: [
            ["#FF5733", "#FFC300", "#DAF7A6", "#33FFBD", "#33FFF3"],
            ["#FF6F61", "#FFD700", "#7CFC00", "#00CED1", "#20B2AA"],
            ["#FF8C00", "#FFD700", "#ADFF2F", "#40E0D0", "#00FA9A"]
            ],
            Dreamy: [
            ["#B19CD9", "#E0BBE4", "#957DAD", "#D291BC", "#F3E5F5"],
            ["#C5B0E3", "#EAD2F2", "#A087C0", "#DAB6D6", "#F8F0FF"],
            ["#D8BFD8", "#E6E6FA", "#DDA0DD", "#EE82EE", "#F5DEB3"]
            ]
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
        const moods = {};

        for (let moodName in data) {
            // Convert object (from Firebase) to array
            const palettes = data[moodName];
            moods[moodName] = Array.isArray(palettes) ? palettes : Object.values(palettes);
        }

        setMoodColors(moods);
        if (!selectedMood) setSelectedMood(Object.keys(moods)[0]);
        }
      setLoading(false);
    });
  });
}, [selectedMood]);

const copyColor = (color) => {
    navigator.clipboard.writeText(color);
    setMessage(`Copied ${color} to clipboard!`);

    // Auto-hide message after 2 seconds
    setTimeout(() => setMessage(""), 2000);
  };
 const savePalette = (palette) => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must log in to save palettes!");
    return;
  }

  const paletteRef = ref(rtdb, `users/${user.uid}/palettes`);
  const newPaletteRef = push(paletteRef);

  set(newPaletteRef, {
    mood: selectedMood,
    colors: palette,
    createdAt: Date.now()
  })
    .then(() => alert("🎉 Palette saved!"))
    .catch(console.error);
};

  if (loading) return <p>Loading moods...</p>;

 return (
    <div className="w-screen h-screen bg-gray-100 p-6 overflow-y-auto">
      {/* Message Toast */}
      {message && (
        <div className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded shadow-md z-50">
          {message}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-center">Dynamic Mood Palettes</h1>

      {/* Mood Selector */}
      <select
        className="mb-6 p-3 border rounded w-full text-lg"
        value={selectedMood}
        onChange={(e) => setSelectedMood(e.target.value)}
      >
        {Object.keys(moodColors).map((mood) => (
          <option key={mood} value={mood}>
            {mood}
          </option>
        ))}
      </select>

      {/* All palettes */}
      <div className="flex flex-col gap-6">
        {moodColors[selectedMood]?.map((palette, paletteIndex) => (
          <div
            key={paletteIndex}
            className="flex items-center justify-between p-4 rounded shadow-md bg-white"
          >
            <div className="flex gap-2">
              {palette.map((color, colorIndex) => (
                <div
                  key={colorIndex}
                  className="w-12 h-12 rounded shadow cursor-pointer relative group"
                  style={{ backgroundColor: color }}
                  onClick={() => copyColor(color)}
                >
                  <span className="absolute bottom-full mb-1 hidden group-hover:block text-xs bg-black text-white px-1 rounded">
                    {color}
                  </span>
                </div>
              ))}
            </div>

            {/* Save Icon */}
            <button
              onClick={() => savePalette(palette)}
              className="ml-4 text-green-500 hover:text-green-700"
              title="Save Palette"
            >
              💾
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
