import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { setupUsernameGenerator } from "./firebaseSetUp";
import Landing from "./components/Landing";
import Login from "./components/Login";
import MoodPalette from "./components/MoodPalette";
import HarmonyPalette from "./components/HarmonyPalette";
import MyPalettes from "./components/MyPalettes";

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [paletteMode, setPaletteMode] = useState(null);

  useEffect(() => {
    const init = async () => {
      await setupUsernameGenerator();
      onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    };
    init();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user)
    return (
      <Login
        onLogin={(user, generatedUsername) => {
          setUser(user);
          setUsername(generatedUsername);
        }}
      />
    );

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-100 w-full">
        {/* Navbar */}
        <div className="flex justify-between items-center px-6 py-4 bg-white shadow">
          {/* Left side links */}
          <div className="flex gap-4">
            <Link
              to="/"
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Mood Palette
            </Link>
          </div>

          {/* Right side links + logout */}
          <div className="flex items-center gap-4">
            <Link
              to="/mypalettes"
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              My Palettes
            </Link>
            <button
              onClick={() => signOut(auth)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route
              path="/"
              element={
                paletteMode === null ? (
                  <Landing username={username} onSelectMode={setPaletteMode} />
                ) : paletteMode === "mood" ? (
                  <MoodPalette />
                ) : (
                  <HarmonyPalette />
                )
              }
            />
            <Route path="/mypalettes" element={<MyPalettes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
