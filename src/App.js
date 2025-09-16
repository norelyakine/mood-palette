import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { setupUsernameGenerator } from "./firebaseSetUp";

import Login from "./components/Login";
import MoodPalette from "./components/MoodPalette";
import MyPalettes from "./components/MyPalettes";

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

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
  {/* Top bar */}
  <div className="flex justify-between items-center px-6 py-4 bg-white shadow">
    <p className="font-semibold">Welcome, {username}!</p>
    <button
      onClick={() => signOut(auth)}
      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
    >
      Logout
    </button>
  </div>

  {/* Navigation Links */}
  <div className="flex gap-4 px-6 py-2 bg-gray-50 shadow-inner">
    <Link
      to="/"
      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Mood Palette
    </Link>
    <Link
      to="/mypalettes"
      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
    >
      My Palettes
    </Link>
  </div>

  {/* Main content */}
  <div className="flex-1 p-6 overflow-auto">
    <Routes>
      <Route path="/" element={<MoodPalette />} />
      <Route path="/mypalettes" element={<MyPalettes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>
</div>

    </Router>
  );
}
