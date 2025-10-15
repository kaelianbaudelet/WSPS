import localFont from "next/font/local";

export const displayFont = localFont({
    variable: "--font-display",
    src: [
        {
            path: "../../public/fonts/SNPro/SNPro-Semibold.ttf",
            weight: "200",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-SemiboldItalic.ttf",
            weight: "200",
            style: "italic",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-Semibold.ttf",
            weight: "300",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-SemiboldItalic.ttf",
            weight: "300",
            style: "italic",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-Semibold.ttf",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-SemiboldItalic.ttf",
            weight: "400",
            style: "italic",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-Semibold.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-SemiboldItalic.ttf",
            weight: "500",
            style: "italic",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-Bold.ttf",
            weight: "600",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-BoldItalic.ttf",
            weight: "600",
            style: "italic",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-Bold.ttf",
            weight: "700",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-BoldItalic.ttf",
            weight: "700",
            style: "italic",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-Heavy.ttf",
            weight: "800",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-HeavyItalic.ttf",
            weight: "800",
            style: "italic",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-Black.ttf",
            weight: "900",
            style: "normal",
        },
        {
            path: "../../public/fonts/SNPro/SNPro-BlackItalic.ttf",
            weight: "900",
            style: "italic",
        },
    ],
});

export const serifFont = localFont({
    variable: "--font-serif",
    src: '../../public/fonts/Verveine/Verveine-Regular.ttf',
})