// src/App.js
import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";

import Login from "./components/Login";
import MoodPalette from "./components/MoodPalette";
import MyPalettes from "./components/MyPalettes";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!user) return <Login />;

  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 w-full max-w-lg mx-auto p-4">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-4 w-full">
          <p className="font-semibold">Welcome, {user.email}</p>
          <button
            onClick={() => signOut(auth)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-4 mb-6">
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

        {/* Routes */}
        <Routes>
          <Route path="/" element={<MoodPalette />} />
          <Route path="/mypalettes" element={<MyPalettes />} />
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
