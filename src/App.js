import React, { useState, useEffect } from "react";
import { auth, rtdb } from "./firebase";
import { ref, get } from "firebase/database";
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

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch username from DB
        const userRef = ref(rtdb, `users/${firebaseUser.uid}/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUsername(snapshot.val());
        }
      } else {
        setUser(null);
        setUsername("");
      }
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
    <div className="h-screen flex flex-col bg-gray-100 w-full">
      {/* Navbar */}
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow">
        {/* Left side links */}
        <div className="flex gap-4">
          <Link
            to="/"
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            PLT
          </Link>
        </div>

        {/* Right side links + logout */}
        <div className="flex items-center gap-4">
          <Link
            to="/mypalettes"
            className="px-3 py-1 text-gray-800 rounded hover:text-gray-700"
          >
            My Palettes
          </Link>
          <button
            onClick={() => signOut(auth)}
            className="text-gray-800 px-3 py-1 rounded hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={<Landing username={username} onSelectMode={setPaletteMode} />}
          />
          <Route path="/mood" element={<MoodPalette />} />
          <Route path="/harmony" element={<HarmonyPalette />} />
          <Route path="/mypalettes" element={<MyPalettes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  </Router>
);

}
