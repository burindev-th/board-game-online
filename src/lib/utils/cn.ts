import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// สอน tailwind-merge ให้รู้จัก token ของเรา ไม่งั้น text-h1 จะถูกมองเป็นสีแล้วโดน text-fg ทับ
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display", "display-lg", "h1", "h1-lg", "h2", "h2-lg", "h3", "h3-lg",
            "body", "small", "caption", "number", "number-lg",
          ],
        },
      ],
      shadow: [{ shadow: ["brutal-sm", "brutal", "brutal-lg"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
