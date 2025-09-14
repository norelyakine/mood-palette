// src/components/Login.js
import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");

  // Handle incoming email link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem("emailForSignIn");
      if (!storedEmail) {
        storedEmail = window.prompt("Please enter your email for confirmation:");
      }
      signInWithEmailLink(auth, storedEmail, window.location.href)
        .then((result) => {
          console.log("Logged in:", result.user);
          window.localStorage.removeItem("emailForSignIn");
          if (onLogin) onLogin(result.user);
        })
        .catch(console.error);
    }
  }, [onLogin]);

  const handleLogin = () => {
    const actionCodeSettings = {
      // 👇 redirect back to app root after login
      url: "http://localhost:3000/",
      handleCodeInApp: true
    };
    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSignIn", email);
        alert("✅ Check your email for the login link!");
      })
      .catch(console.error);
  };

  return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Login with Email</h1>
      <input
        type="email"
        placeholder="Your email"
        className="w-full p-2 mb-4 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
      >
        Send Login Link
      </button>
    </div>
  );
}
