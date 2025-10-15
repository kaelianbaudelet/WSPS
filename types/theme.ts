export type ThemeColor = keyof typeof import("@/resources/data/colors.json");
export type ThemeStyle = {
    primary: string;
    radius: string;
};

export type StyleType = keyof ThemeStyle;
