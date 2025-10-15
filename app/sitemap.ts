import { siteConfig } from "@/resources/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModifiedAt = "2025-04-10T13:41:37.718Z";
    return [
        {
            url: siteConfig.domains.production + "/",
            lastModified: lastModifiedAt,
        },
        {
            url: `${siteConfig.domains.production}/dashboard`,
            lastModified: lastModifiedAt,
        },
        {
            url: `${siteConfig.domains.production}/auth/sign-up`,
            lastModified: lastModifiedAt,
        },
        {
            url: `${siteConfig.domains.production}/auth/sign-in`,
            lastModified: lastModifiedAt,
        },
    ];
}
