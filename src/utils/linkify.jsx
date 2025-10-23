import React from "react";

import { getDisplayText, isUrl } from "./linkUtils";

export function linkifyText(text = "", maxLength = 50, _context = "default") {
  if (!text) return text;

  // Улучшенное регулярное выражение для URL
  const urlRegex = /((https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+)/gi;
  const parts = [];
  let lastIndex = 0;
  let match;
  let index = 0;

  // Обработка переносов строк
  const processedText = text.replace(/\n/g, "\n");

  while ((match = urlRegex.exec(processedText)) !== null) {
    const url = match[0];
    const start = match.index;

    // Добавляем текст до ссылки
    if (start > lastIndex) {
      const nonUrl = processedText.slice(lastIndex, start);
      parts.push(
        <React.Fragment key={`text-${index}`}>
          {formatText(nonUrl)}
        </React.Fragment>,
      );
      index++;
    }

    // Обрабатываем ссылку
    let href = url;
    if (!/^https?:\/\//.test(href)) {
      href = "http://" + href;
    }

    // Используем новую утилиту для отображения ссылки
    const displayUrl = getDisplayText(url, maxLength);
    const isExternal = isUrl(href);

    parts.push(
      <a
        key={`link-${index}`}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="smart-link text-blue-400 hover:text-blue-300 underline break-all"
        title={url}
      >
        {displayUrl}
        {isExternal && <span className="ml-1 text-xs">🔗</span>}
      </a>,
    );
    index++;
    lastIndex = start + url.length;
  }

  // Добавляем оставшийся текст
  if (lastIndex < processedText.length) {
    parts.push(
      <React.Fragment key={`text-${index}`}>
        {formatText(processedText.slice(lastIndex))}
      </React.Fragment>,
    );
  }

  return parts.length > 0 ? parts : processedText;
}

// Функция для форматирования текста (код, жирный текст и т.д.)
function formatText(text) {
  if (!text) return text;

  // Обработка кода (в обратных кавычках)
  const codeRegex = /`([^`]+)`/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let index = 0;

  while ((match = codeRegex.exec(text)) !== null) {
    const code = match[1];
    const start = match.index;

    // Добавляем текст до кода
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    // Добавляем код
    parts.push(<code key={`code-${index}`}>{code}</code>);
    index++;
    lastIndex = start + match[0].length;
  }

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 1 ? parts : text;
}
