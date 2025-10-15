import { ru } from "./ru";

const dictionaries: Record<string, Record<string, unknown>> = { ru };
let current: string = "ru";

export function t(path: string): string {
  try {
    const parts = path.split(".");
    let node: unknown = dictionaries[current];
    for (const p of parts) node = node?.[p];
    return node ?? path;
  } catch {
    return path;
  }
}

export function setLocale(locale: string): void {
  if (dictionaries[locale]) current = locale;
}
