import { ru } from "./ru";

const dictionaries = { ru };
let current = "ru";

export function t(path) {
  try {
    const parts = path.split(".");
    let node = dictionaries[current];
    for (const p of parts) node = node?.[p];
    return node ?? path;
  } catch {
    return path;
  }
}

export function setLocale(locale) {
  if (dictionaries[locale]) current = locale;
}
