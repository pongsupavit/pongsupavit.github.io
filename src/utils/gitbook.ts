import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Resolves paths relative to project root safely for both dev and prod
 */
export const getGitbookPath = (relativePath: string) => {
    return path.resolve(process.cwd(), "src/content/gitbook", relativePath);
};

/**
 * Type-safe config item
 */
export interface ConfigItem {
    name: string;
    hierarchy: number;
    section: string;
    type: string;
    icon: string;
    color: string;
}

/**
 * Parses the unified config.md file
 */
export const getConfigItems = (): ConfigItem[] => {
    try {
        const configPath = getGitbookPath("config/config.md");
        const configText = readFileSync(configPath, "utf-8");
        const tableLines = configText.split("\n").filter((l: string) => l.trim().startsWith("|")).slice(2);

        return tableLines.map((line: string) => {
            const cells = line.split("|").map((c: string) => c.trim()).filter(Boolean);
            if (cells.length < 5) return null;
            return {
                name: cells[0].replace(/\\/g, ""),
                hierarchy: parseInt(cells[1]) || 0,
                section: cells[2],
                type: cells[3],
                icon: cells[4],
                color: (cells[5] || "default").replace(/\\/g, "")
            };
        }).filter((item: ConfigItem | null): item is ConfigItem => item !== null);
    } catch (e) {
        console.error("Error parsing config.md:", e);
        return [];
    }
};

/**
 * Parses SUMMARY.md into items
 */
export interface SummaryItem {
    label: string;
    menuLabel: string;
    href: string;
    titleAttr: string | null;
    isExternal: boolean;
    slug: string | null;
    section: string | null;
}

export const getSummaryItems = (): SummaryItem[] => {
    try {
        const summaryPath = getGitbookPath("SUMMARY.md");
        const text = readFileSync(summaryPath, "utf-8");
        const items: SummaryItem[] = [];
        const lines = text.split(/\r?\n/);
        let currentSection: string | null = null;

        for (const line of lines) {
            const heading = line.match(/^##\s+(.+)/);
            if (heading) {
                currentSection = heading[1].trim();
                continue;
            }

            const match = line.match(/^\s*\*\s+\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/);
            if (!match) continue;

            const label = match[1].trim();
            const href = match[2].trim();
            const titleAttr = match[3]?.trim() || null;
            const isExternal = /^https?:\/\//i.test(href);
            const slug = isExternal ? null : href.replace(/^\.\//, "").replace(/\.md$/i, "");

            items.push({
                label,
                menuLabel: titleAttr || label,
                href,
                titleAttr,
                isExternal,
                slug,
                section: currentSection
            });
        }
        return items;
    } catch (e) {
        console.error("Error parsing SUMMARY.md:", e);
        return [];
    }
};

/**
 * Generates the slug mapping to handle duplicate filenames
 */
export const buildSlugMap = (entries: any[]) => {
    const counts = new Map<string, number>();
    const map = new Map<string, string>();

    for (const entry of entries) {
        // Only process content pages
        if (/^(README|SUMMARY)\.md$/i.test(entry.id)) continue;

        const base = entry.id.replace(/\.md$/, "").split("/").pop() || "";
        const next = (counts.get(base) || 0) + 1;
        counts.set(base, next);
        const slug = next === 1 ? base : `${base}-${next}`;
        map.set(entry.id.replace(/\.md$/, ""), slug);
    }

    return map;
};
