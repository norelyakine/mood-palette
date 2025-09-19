import React from "react";

export default function Landing({ username, onSelectMode }) {
  return (
    <div className="flex flex-col items-center justify-center mt-10 px-6">
      <h1 className="text-3xl font-bold mb-2">Welcome, {username}!</h1>
      <p className="text-gray-600 text-lg mb-8">How do you want to explore color today?</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Harmony Mode Card */}
        <div
          onClick={() => onSelectMode("harmony")}
          className="cursor-pointer bg-white shadow-md rounded-lg p-6 w-80 hover:shadow-xl transition"
        >
          <h2 className="text-xl font-semibold mb-2">Play with Color Harmony</h2>
          <p className="text-gray-600 text-sm">
            Generate palettes that just work. Tweak freely, get instant feedback, and learn how colors relate.
          </p>
        </div>

        {/* Mood Mode Card */}
        <div
          onClick={() => onSelectMode("mood")}
          className="cursor-pointer bg-white shadow-md rounded-lg p-6 w-80 hover:shadow-xl transition"
        >
          <h2 className="text-xl font-semibold mb-2">Design by Emotion</h2>
          <p className="text-gray-600 text-sm">
            Curated palettes that evoke specific moods. No tweaks allowed, these are emotionally intentional.
          </p>
        </div>
      </div>
    </div>
  );
}
