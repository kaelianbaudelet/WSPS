import colors from "@/resources/data/colors.json";
import type { StyleType, ThemeColor, ThemeStyle } from "@/types/theme";
import { useEffect, useState } from "react";

const DEFAULT_STYLE: ThemeStyle = {
    primary: "oklch(0.546 0.245 262.881)", // blue
    radius: "0.8rem",
};

export function useStyle() {
    const [style, setStyle] = useState<ThemeStyle>(DEFAULT_STYLE);

    const updateStyle = (type: StyleType, value: string) => {
        const cssVar = type === "radius" ? "--radius-lg" : "--primary";
        const dynamicValue = type === "radius" ? value : colors[value as ThemeColor];

        document.documentElement.style.setProperty(cssVar, dynamicValue);
        localStorage.setItem(cssVar, dynamicValue);
        setStyle((prev) => ({ ...prev, [type]: dynamicValue }));
    };

    useEffect(() => {
        const primary = localStorage.getItem("--primary");
        const radius = localStorage.getItem("--radius-lg");
        if (primary) {
            const colorKey = Object.entries(colors).find(([_, value]) => value === primary)?.[0];
            if (colorKey) updateStyle("primary", colorKey);
        }

        if (radius) {
            updateStyle("radius", radius);
        }
    }, []);

    return { style, updateStyle };
}
