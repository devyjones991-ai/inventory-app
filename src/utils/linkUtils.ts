import { LINK_SETTINGS } from "../constants/linkSettings";

export interface LinkOptions {
  maxLength?: number;
  showFullOnHover?: boolean;
  showIcon?: boolean;
  className?: string;
  context?: keyof typeof import("../constants/linkSettings").LINK_CONTEXTS;
}

export function isUrl(text: string): boolean {
  const urlRegex = /^https?:\/\//;
  return urlRegex.test(text);
}

export function truncateUrl(
  url: string,
  maxLength: number = LINK_SETTINGS.MAX_LENGTH,
): string {
  if (url.length <= maxLength) {
    return url;
  }
  return `${url.substring(0, maxLength)}...`;
}

export function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return url;
  }
}

export function getDisplayText(
  url: string,
  maxLength: number = LINK_SETTINGS.MAX_LENGTH,
): string {
  if (url.length <= maxLength) {
    return url;
  }

  // Пытаемся показать домен + часть пути
  const domain = getDomainFromUrl(url);
  const remainingLength = maxLength - domain.length - 3; // 3 для "..."

  if (remainingLength > 10) {
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    const truncatedPath =
      path.length > remainingLength
        ? path.substring(0, remainingLength) + "..."
        : path;
    return `${domain}${truncatedPath}`;
  }

  return truncateUrl(url, maxLength);
}

export function createLinkProps(url: string, options: LinkOptions = {}) {
  const {
    maxLength = LINK_SETTINGS.MAX_LENGTH,
    showFullOnHover = LINK_SETTINGS.SHOW_FULL_ON_HOVER,
    showIcon = LINK_SETTINGS.SHOW_EXTERNAL_ICON,
    className = "",
  } = options;

  const displayText = getDisplayText(url, maxLength);
  const isExternal = url.startsWith("http");

  return {
    href: url,
    target: isExternal ? "_blank" : undefined,
    rel: isExternal ? "noopener noreferrer" : undefined,
    title: showFullOnHover ? url : undefined,
    className: `smart-link text-blue-400 hover:text-blue-300 underline break-all ${className}`,
    displayText,
    showIcon: isExternal && showIcon,
  };
}
