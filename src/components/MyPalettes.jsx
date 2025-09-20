import React, { useEffect, useState, useMemo } from "react";
import { rtdb, auth } from "../firebase";
import { ref, get, child, remove} from "firebase/database";
import { createCollection, deleteCollection, deletePalette } from "../firebaseSetUp";
import toast from "react-hot-toast";
import "../App.css";

function normalizeMoodLabel(mood) {
  if (!mood || typeof mood !== "string") return "Unknown";
  const trimmed = mood.trim();
  if (!trimmed) return "Unknown";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function cleanHex(value) {
  const s = String(value).trim().replace(/^['"]|['"]$/g, "");
  const valid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
  return valid ? s : null;
}

function sanitizePalette([id, p]) {
  const colors = Array.isArray(p.colors) ? p.colors.map(cleanHex).filter(Boolean) : [];
  const type = p.type === "harmony" ? "harmony" : "mood";
  const mood = type === "mood" ? normalizeMoodLabel(p.mood) : null;
  const createdAt = typeof p.createdAt === "number" ? p.createdAt : 0;
  return { id, type, mood, colors, createdAt, isValid: colors.length > 0 };
}

export default function MyPalettes() {
  const [palettes, setPalettes] = useState({});
  const [collections, setCollections] = useState({});
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [activeCollection, setActiveCollection] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const dbRef = ref(rtdb);
      const palettesSnap = await get(child(dbRef, `users/${user.uid}/palettes`));
      setPalettes(palettesSnap.exists() ? palettesSnap.val() : {});
      const collectionsSnap = await get(child(dbRef, `users/${user.uid}/collections`));
      setCollections(collectionsSnap.exists() ? collectionsSnap.val() : {});
      setLoading(false);
    }
    fetchData();
  }, []);

  const grouped = useMemo(() => {
    const acc = {};
    Object.entries(palettes)
      .map(sanitizePalette)
      .filter((p) => p.isValid)
      .forEach((p) => {
        const key = p.type === "harmony" ? "Harmony" : p.mood || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
      });
    Object.values(acc).forEach((list) => list.sort((a, b) => b.createdAt - a.createdAt));
    return acc;
  }, [palettes]);

  const sortedGroups = useMemo(() => {
    return Object.entries(grouped).sort((a, b) => {
      const diff = b[1].length - a[1].length;
      if (diff !== 0) return diff;
      return a[0].localeCompare(b[0]);
    });
  }, [grouped]);

  if (loading) return <p>Loading palettes…</p>;

  return (
    <>
      <div className="h-full overflow-y-auto scroll-smooth w-full flex flex-col px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Collections</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 flex items-center justify-center bg-white drop-shadow text-gray-800 rounded-full hover:bg-gray-200"
            title="New Collection"
          >
            +
          </button>

        </div>

        {/* Collections, horizontal carousel*/}
        {Object.keys(collections).length === 0 ? (
          <p className="text-gray-500 mb-6">No collections yet.</p>
        ) : (
          <div className="carousel mb-8 pb-2 overflow-y-hidden">
            <div className="carousel-track">
              {Object.entries(collections).map(([id, collection]) => {
                const previewPalette =
                  Array.isArray(collection.paletteIds) && collection.paletteIds.length > 0
                    ? palettes[collection.paletteIds[0]]
                    : null;

                const previewColors = Array.isArray(previewPalette?.colors)
                  ? previewPalette.colors.map(cleanHex).filter(Boolean)
                  : [];

                return (
                 <div
                  key={id}
                  className="carousel-card relative group rounded-lg shadow hover:shadow-md transition cursor-pointer bg-white overflow-hidden"
                  onClick={() => setActiveCollection({ id, ...collection })}
                >

                  {/* Delete button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteCollection(id);
                      const snap = await get(child(ref(rtdb), `users/${auth.currentUser.uid}/collections`));
                      setCollections(snap.exists() ? snap.val() : {});
                      toast.success("Collection deleted");
                    }}
                    className="absolute top-2 right-2 text-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full px-2 py-1"
                    title="Delete collection"
                  >
                    🗑️
                  </button>

                  {/* Preview area */}
                  <div className="flex h-20">
                    {previewColors.length > 0 ? (
                      previewColors.map((c, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                      ))
                    ) : (
                      <div className="flex-1 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        Empty
                      </div>
                    )}
                  </div>

                  {/* Info bar */}
                  <div className="p-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">{collection.name}</span>
                    <span className="text-xs text-gray-500">
                      {(collection.paletteIds && collection.paletteIds.length) || 0} saved
                    </span>
                  </div>
                 </div>

                );
              })}
            </div>
          </div>
        )}

        {/* Saved Palettes, horizontal carousel*/}
        <h1 className="text-xl font-bold mb-4">My Saved Palettes</h1>

        {sortedGroups.length === 0 ? (
          <p className="text-gray-500">No palettes saved yet.</p>
        ) : (
          <div className="carousel mb-8 pb-2 overflow-y-hidden">
            <div className="carousel-track">
              {sortedGroups.map(([groupName, items]) => (
                <div
                  key={groupName}
                  className="carousel-card rounded-lg shadow hover:shadow-md transition cursor-pointer bg-white overflow-hidden"
                  onClick={() => setActiveGroup({ name: groupName, palettes: items })}
                >
                  {/* Color tiles */}
                  <div className="flex h-20 w-full">
                    {items[0].colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>

                  {/* Info bar */}
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="font-semibold text-gray-700 truncate">{groupName}</span>
                    <span className="text-xs text-gray-500">{items.length} saved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Saved Palettes Details */}
      {activeGroup && (
        <div className="fixed inset-0  bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white scroll-hidden rounded-lg shadow-lg max-w-xl w-full max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{activeGroup.name}</h2>
              <button
                onClick={() => setActiveGroup(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              {activeGroup.palettes.map((p) => (
                  <div
                      key={p.id}
                      className="relative group rounded border border-gray-200 p-3 shadow-sm bg-white"
                    >
                    {/* Delete button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deletePalette(p.id);

                      // refresh global palettes
                      const snap = await get(child(ref(rtdb), `users/${auth.currentUser.uid}/palettes`));
                      setPalettes(snap.exists() ? snap.val() : {});

                      // update the activeGroup in place
                      setActiveGroup((prev) => ({
                        ...prev,
                        palettes: prev.palettes.filter((pal) => pal.id !== p.id),
                      }));

                      toast.success("Palette deleted");
                    }}
                    className="absolute top-2 right-2 text-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full px-2 py-1"
                  >
                    🗑️
                  </button>


                    {/* Metadata */}
                    <div className="mb-2 text-sm text-gray-600 flex justify-between">
                      <span>Saved {new Date(p.createdAt).toLocaleDateString()}</span>
                      <span className="font-mono text-xs text-gray-400">ID: {p.id}</span>
                    </div>

                    {/* Color tiles */}
                    <div className="flex h-20 w-full rounded overflow-hidden">
                      {p.colors.map((c, i) => (
                        <div
                          key={i}
                          className="flex-1 h-full cursor-pointer hover:opacity-80 transition"
                          style={{ backgroundColor: c }}
                          title={`Click to copy ${c}`}
                          onClick={() => {
                            navigator.clipboard.writeText(c);
                            toast.success(`Copied ${c}`);
                          }}
                        />
                      ))}
                      </div>

                    {/* Hex codes */}
                    <div className="mt-2 flex justify-between text-xs text-gray-500 font-mono">
                      {p.colors.map((c, i) => (
                        <span key={i}>{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
                </div>
                </div>
              </div>
      )}

      {/* Modal: Create Collection */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
            <h3 className="text-lg font-bold mb-3">Create Collection</h3>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-400"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newCollectionName.trim()) return;
                  await createCollection(newCollectionName.trim());
                  const snap = await get(
                    child(ref(rtdb), `users/${auth.currentUser.uid}/collections`)
                  );
                  setCollections(snap.exists() ? snap.val() : {});
                  setNewCollectionName("");
                  setShowCreateModal(false);
                  toast.success("Collection created!");
                }}
                className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Collection Details */}
      {activeCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{activeCollection.name}</h2>
              <button
                onClick={() => setActiveCollection(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              {Array.isArray(activeCollection.paletteIds) && activeCollection.paletteIds.length > 0 ? (
                activeCollection.paletteIds.map((pid) => {
                  const p = palettes[pid];
                  if (!p) return null;
                  return (
                    <div
                      key={pid}
                      className="relative group rounded border border-gray-200 p-3 shadow-sm bg-white"
                    >
                      {/* Metadata */}
                      <div className="mb-2 text-sm text-gray-600 flex justify-between">
                        <span>Saved {new Date(p.createdAt).toLocaleDateString()}</span>
                        <span className="font-mono text-xs text-gray-400">ID: {pid}</span>
                      </div>

                      {/* Color tiles */}
                      <div className="flex h-20 w-full rounded overflow-hidden">
                        {p.colors.map((c, i) => (
                          <div
                            key={i}
                            className="flex-1 h-full cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundColor: c }}
                            title={`Click to copy ${c}`}
                            onClick={() => {
                              navigator.clipboard.writeText(c);
                              toast.success(`Copied ${c}`);
                            }}
                          />
                        ))}
                      </div>

                      {/* Hex codes */}
                      <div className="mt-2 flex justify-between text-xs text-gray-500 font-mono">
                        {p.colors.map((c, i) => (
                          <span key={i}>{c}</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">This collection is empty.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
