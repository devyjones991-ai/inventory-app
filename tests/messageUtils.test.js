import {
  getMessageType,
  isLongMessage,
  hasCode,
  hasLinks,
  getMessageDimensions,
} from "../src/utils/messageUtils";

describe("messageUtils", () => {
  describe("getMessageType", () => {
    test("возвращает пустую строку для пустого контента", () => {
      expect(getMessageType("")).toBe("");
      expect(getMessageType(null)).toBe("");
      expect(getMessageType(undefined)).toBe("");
    });

    test("определяет сообщения с кодом", () => {
      expect(getMessageType("Используйте `console.log()` для отладки")).toBe(
        "code-message",
      );
      expect(getMessageType("Код: `npm install`")).toBe("code-message");
    });

    test("определяет сообщения со ссылками", () => {
      expect(getMessageType("Проверьте https://example.com")).toBe(
        "link-message",
      );
      expect(getMessageType("Посетите www.github.com")).toBe("link-message");
    });

    test("определяет очень длинные сообщения", () => {
      const longText = "a".repeat(201);
      expect(getMessageType(longText)).toBe("very-long-message");
    });

    test("определяет длинные сообщения", () => {
      const mediumText = "a".repeat(150);
      expect(getMessageType(mediumText)).toBe("long-message");
    });

    test("приоритизирует код над ссылками", () => {
      expect(
        getMessageType("Код: `npm install` и ссылка: https://example.com"),
      ).toBe("code-message");
    });

    test("приоритизирует код над длиной", () => {
      const longCodeText = "`" + "a".repeat(200) + "`";
      expect(getMessageType(longCodeText)).toBe("code-message");
    });

    test("возвращает пустую строку для коротких сообщений", () => {
      expect(getMessageType("Короткое сообщение")).toBe("");
    });
  });

  describe("isLongMessage", () => {
    test("возвращает true для длинных сообщений", () => {
      expect(isLongMessage("a".repeat(150))).toBe(true);
    });

    test("возвращает false для коротких сообщений", () => {
      expect(isLongMessage("Короткое")).toBe(false);
    });

    test("возвращает false для пустого контента", () => {
      expect(isLongMessage("")).toBe(false);
      expect(isLongMessage(null)).toBe(false);
    });
  });

  describe("hasCode", () => {
    test("возвращает true для сообщений с кодом", () => {
      expect(hasCode("Используйте `console.log()`")).toBe(true);
    });

    test("возвращает false для сообщений без кода", () => {
      expect(hasCode("Обычное сообщение")).toBe(false);
    });

    test("возвращает false для пустого контента", () => {
      expect(hasCode("")).toBe(false);
    });
  });

  describe("hasLinks", () => {
    test("возвращает true для сообщений со ссылками", () => {
      expect(hasLinks("https://example.com")).toBe(true);
      expect(hasLinks("www.github.com")).toBe(true);
    });

    test("возвращает false для сообщений без ссылок", () => {
      expect(hasLinks("Обычное сообщение")).toBe(false);
    });

    test("возвращает false для пустого контента", () => {
      expect(hasLinks("")).toBe(false);
    });
  });

  describe("getMessageDimensions", () => {
    test("возвращает размеры по умолчанию для пустого контента", () => {
      const desktop = getMessageDimensions("", false);
      expect(desktop).toEqual({ minWidth: "100px", maxWidth: "80%" });

      const mobile = getMessageDimensions("", true);
      expect(mobile).toEqual({ minWidth: "60px", maxWidth: "85%" });
    });

    test("возвращает размеры для очень длинных сообщений", () => {
      const longText = "a".repeat(250);
      const desktop = getMessageDimensions(longText, false);
      expect(desktop).toEqual({ minWidth: "300px", maxWidth: "98%" });

      const mobile = getMessageDimensions(longText, true);
      expect(mobile).toEqual({ minWidth: "120px", maxWidth: "98%" });
    });

    test("возвращает размеры для длинных сообщений", () => {
      const mediumText = "a".repeat(150);
      const desktop = getMessageDimensions(mediumText, false);
      expect(desktop).toEqual({ minWidth: "200px", maxWidth: "95%" });

      const mobile = getMessageDimensions(mediumText, true);
      expect(mobile).toEqual({ minWidth: "80px", maxWidth: "95%" });
    });

    test("возвращает размеры для сообщений с кодом", () => {
      const codeText = "Используйте `console.log()`";
      const desktop = getMessageDimensions(codeText, false);
      expect(desktop).toEqual({ minWidth: "150px", maxWidth: "90%" });

      const mobile = getMessageDimensions(codeText, true);
      expect(mobile).toEqual({ minWidth: "100px", maxWidth: "90%" });
    });

    test("возвращает размеры для сообщений со ссылками", () => {
      const linkText = "Проверьте https://example.com";
      const desktop = getMessageDimensions(linkText, false);
      expect(desktop).toEqual({ minWidth: "120px", maxWidth: "85%" });

      const mobile = getMessageDimensions(linkText, true);
      expect(mobile).toEqual({ minWidth: "80px", maxWidth: "85%" });
    });

    test("возвращает размеры для коротких сообщений", () => {
      const shortText = "Короткое сообщение";
      const desktop = getMessageDimensions(shortText, false);
      expect(desktop).toEqual({ minWidth: "100px", maxWidth: "80%" });

      const mobile = getMessageDimensions(shortText, true);
      expect(mobile).toEqual({ minWidth: "60px", maxWidth: "85%" });
    });
  });
});
