export const LINK_SETTINGS = {
  MAX_LENGTH: 50,
  SHOW_FULL_ON_HOVER: true,
  BREAK_WORDS: true,
  OPEN_IN_NEW_TAB: true,
  SHOW_EXTERNAL_ICON: true,
};

export const LINK_CONTEXTS = {
  CHAT: { maxLength: 50, showIcon: true },
  DESCRIPTION: { maxLength: 60, showIcon: true },
  HARDWARE: { maxLength: 40, showIcon: true },
  TASKS: { maxLength: 45, showIcon: true },
  NAVIGATION: { maxLength: 30, showIcon: true },
} as const;
