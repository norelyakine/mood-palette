// src/firebaseSetup.js
import { rtdb } from "./firebase"; // your RTDB instance
import { ref, get, set, child } from "firebase/database";

export const setupUsernameGenerator = async () => {
  const dbRef = ref(rtdb);

  try {
    const snapshot = await get(child(dbRef, "usernameGenerator"));
    if (!snapshot.exists()) {
      const data = {
        colors: ["Crimson", "Azure", "Emerald", "Golden", "Lavender"],
        desserts: ["Cookie", "Cupcake", "Brownie", "Macaron", "Pie"]
      };
      await set(child(dbRef, "usernameGenerator"), data);
      console.log("usernameGenerator node created!");
    } else {
      console.log("usernameGenerator already exists. Skipping...");
    }
  } catch (err) {
    console.error("Error checking or adding usernameGenerator:", err);
  }
};
