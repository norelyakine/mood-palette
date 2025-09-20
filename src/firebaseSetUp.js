import { rtdb, auth } from "./firebase"; 
import { ref, get, remove, set, push, child } from "firebase/database";

export const addPaletteToCollection = async (collectionId, paletteId) => {
  const user = auth.currentUser;
  if (!user) return;

  const paletteIdsRef = ref(rtdb, `users/${user.uid}/collections/${collectionId}/paletteIds`);
  const snapshot = await get(paletteIdsRef);
  const current = snapshot.exists() ? snapshot.val() : [];

  await set(paletteIdsRef, [...current, paletteId]);
};
export const createCollection = async (name) => {
  const user = auth.currentUser;
  if (!user) return;

  const collectionsRef = ref(rtdb, `users/${user.uid}/collections`);
  const newRef = push(collectionsRef);

  await set(newRef, {
    id: newRef.key,
    name,
    createdAt: Date.now(),
    paletteIds: [],
  });

  return newRef.key;
};
export async function deleteCollection(id) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await remove(ref(rtdb, `users/${user.uid}/collections/${id}`));
}
export async function deletePalette(id) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await remove(ref(rtdb, `users/${user.uid}/palettes/${id}`));
}
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
