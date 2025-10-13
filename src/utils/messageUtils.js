/**
 * Утилиты для работы с сообщениями чата
 */

/**
 * Определяет тип сообщения для применения соответствующих CSS классов
 * @param {string} content - Содержимое сообщения
 * @returns {string} - CSS класс для сообщения
 */
export function getMessageType(content) {
  if (!content) return "";

  const text = content.toString();

  // Проверяем на код (обратные кавычки)
  if (text.includes("`")) {
    return "code-message";
  }

  // Проверяем на ссылки
  if (
    text.includes("http://") ||
    text.includes("https://") ||
    text.includes("www.")
  ) {
    return "link-message";
  }

  // Проверяем длину сообщения
  if (text.length > 200) {
    return "very-long-message";
  }

  if (text.length > 100) {
    return "long-message";
  }

  return "";
}

/**
 * Определяет, является ли сообщение длинным
 * @param {string} content - Содержимое сообщения
 * @returns {boolean}
 */
export function isLongMessage(content) {
  if (!content) return false;
  return content.length > 100;
}

/**
 * Определяет, содержит ли сообщение код
 * @param {string} content - Содержимое сообщения
 * @returns {boolean}
 */
export function hasCode(content) {
  if (!content) return false;
  return content.includes("`");
}

/**
 * Определяет, содержит ли сообщение ссылки
 * @param {string} content - Содержимое сообщения
 * @returns {boolean}
 */
export function hasLinks(content) {
  if (!content) return false;
  return (
    content.includes("http://") ||
    content.includes("https://") ||
    content.includes("www.")
  );
}

/**
 * Получает оптимальную ширину для сообщения
 * @param {string} content - Содержимое сообщения
 * @param {boolean} isMobile - Мобильная версия
 * @returns {object} - Объект с minWidth и maxWidth
 */
export function getMessageDimensions(content, isMobile = false) {
  if (!content) {
    return {
      minWidth: isMobile ? "60px" : "100px",
      maxWidth: isMobile ? "85%" : "80%",
    };
  }

  const text = content.toString();
  const length = text.length;

  if (isMobile) {
    if (length > 200) {
      return { minWidth: "120px", maxWidth: "98%" };
    }
    if (length > 100) {
      return { minWidth: "80px", maxWidth: "95%" };
    }
    if (hasCode(text)) {
      return { minWidth: "100px", maxWidth: "90%" };
    }
    if (hasLinks(text)) {
      return { minWidth: "80px", maxWidth: "85%" };
    }
    return { minWidth: "60px", maxWidth: "85%" };
  } else {
    if (length > 200) {
      return { minWidth: "300px", maxWidth: "98%" };
    }
    if (length > 100) {
      return { minWidth: "200px", maxWidth: "95%" };
    }
    if (hasCode(text)) {
      return { minWidth: "150px", maxWidth: "90%" };
    }
    if (hasLinks(text)) {
      return { minWidth: "120px", maxWidth: "85%" };
    }
    return { minWidth: "100px", maxWidth: "80%" };
  }
}
