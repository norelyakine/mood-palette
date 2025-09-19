import { useEffect } from "react";
import { rtdb } from "../firebase";
import { ref, set } from "firebase/database";
import { hslToHex } from "../utils/colorUtils";

export default function StoreHueWheel() {
  useEffect(() => {
    const wheel = {};
    for (let h = 0; h < 360; h++) {
      wheel[h] = {
        h,
        variants: {
          bright: hslToHex(h, 100, 50),
          soft: hslToHex(h, 70, 65),
          deep: hslToHex(h, 90, 30),
          muted: hslToHex(h, 40, 50)
        }
      };
    }

    const wheelRef = ref(rtdb, "hueWheel");
    set(wheelRef, wheel)
      .then(() => console.log("✅ Hue wheel with variants stored"))
      .catch(console.error);
  }, []);

  return <p className="p-6 text-center">Storing full hue wheel with variants…</p>;
}
