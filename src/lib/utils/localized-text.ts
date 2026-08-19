type LocalizedEntry = Record<string, string>;

export function getLocalizedText(entry: string | LocalizedEntry, lang: string): string {
  if (typeof entry === "string") {
    try {
      const parsed: LocalizedEntry = JSON.parse(entry);
      return parsed[lang] ?? parsed["ru"] ?? parsed["en"] ?? entry;
    } catch {
      return entry;
    }
  }
  return entry[lang] ?? entry["ru"] ?? entry["en"] ?? "";
}
