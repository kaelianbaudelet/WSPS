
const devDomain = "http://localhost:3000";
const prodDomain = "https://wsps.kaelian.dev";

export const siteConfig = {
    demo: {
        enabled: true,
    },
    name: "WSPS",
    version: "1.0.0",
    latestReleaseDate: new Date("2025-10-10"),
    description: "Serveur API de collecte d’emploi du temps pour les écoles du groupe Compétences & Développement",
    extra: {
        missingPfpFallback: "/images/avatars/missing.png",
    },
    domains: {
        development: devDomain,
        production: prodDomain,
        current: process.env.NODE_ENV === "development" ? devDomain : prodDomain,
    },
    auth: {
        emailVerification: {
            enabled: false,
        },
    },
};
