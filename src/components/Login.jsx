import React, { useState } from "react";
import { auth, rtdb } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ref, get, set } from "firebase/database";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  // Generate or fetch username from DB
const assignUsername = async (uid) => {
  const userRef = ref(rtdb, `users/${uid}/username`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    // Fetch colors and desserts
    const generatorSnap = await get(ref(rtdb, "usernameGenerator"));

    // Provide defaults if null
    let colors = ["Crimson", "Azure", "Emerald", "Golden", "Lavender"];
    let desserts = ["Cookie", "Cupcake", "Brownie", "Macaron", "Pie"];

    if (generatorSnap.exists()) {
      const data = generatorSnap.val();
      colors = data.colors || colors;
      desserts = data.desserts || desserts;
    } else {
      // Create the node in DB if it doesn't exist
      await set(ref(rtdb, "usernameGenerator"), { colors, desserts });
    }

    const color = colors[Math.floor(Math.random() * colors.length)];
    const dessert = desserts[Math.floor(Math.random() * desserts.length)];
    const username = `${color}${dessert}`;

    // Save username
    await set(userRef, username);

    return username;
  } else {
    return snapshot.val();
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let userCredential;

      if (isRegister) {
        // Create account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign in
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const username = await assignUsername(userCredential.user.uid);
      onLogin(userCredential.user, username);

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="h-full p-6 max-w-sm mx-auto mt-20 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">{isRegister ? "Register" : "Login"}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Your email"
          className="w-full p-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          {isRegister ? "Register" : "Login"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          className="text-blue-500 underline"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
    </div>
  );
}
