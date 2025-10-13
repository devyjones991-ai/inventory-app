import React from "react";
import { linkifyText } from "../src/utils/linkify";

describe("linkifyText", () => {
  test("возвращает обычный текст в React.Fragment", () => {
    const text = "Просто обычный текст";
    const result = linkifyText(text);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(React.Fragment);
    expect(result[0].props.children).toBe(text);
  });

  test("преобразует URL в ссылки", () => {
    const text = "Проверьте https://example.com для деталей";
    const result = linkifyText(text);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe(React.Fragment);
    expect(result[0].props.children).toBe("Проверьте ");
    expect(result[1].type).toBe("a");
    expect(result[1].props.href).toBe("https://example.com");
    expect(result[1].props.children).toBe("https://example.com");
    expect(result[2].type).toBe(React.Fragment);
    expect(result[2].props.children).toBe(" для деталей");
  });

  test("обрабатывает www ссылки", () => {
    const text = "Посетите www.example.com";
    const result = linkifyText(text);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe(React.Fragment);
    expect(result[0].props.children).toBe("Посетите ");
    expect(result[1].type).toBe("a");
    expect(result[1].props.href).toBe("http://www.example.com");
  });

  test("сокращает длинные URL", () => {
    const longUrl =
      "https://very-long-domain-name.com/very/long/path/to/some/resource";
    const text = `Ссылка: ${longUrl}`;
    const result = linkifyText(text);

    expect(result[1].props.children).toBe(
      "https://very-long-domain-name.com/very/long/pat...",
    );
    expect(result[1].props.title).toBe(longUrl);
  });

  test("обрабатывает код в обратных кавычках", () => {
    const text = "Используйте `console.log()` для отладки";
    const result = linkifyText(text);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(React.Fragment);
    expect(result[0].props.children).toHaveLength(3);
    expect(result[0].props.children[0]).toBe("Используйте ");
    expect(result[0].props.children[1].type).toBe("code");
    expect(result[0].props.children[1].props.children).toBe("console.log()");
    expect(result[0].props.children[2]).toBe(" для отладки");
  });

  test("обрабатывает переносы строк", () => {
    const text = "Первая строка\nВторая строка";
    const result = linkifyText(text);

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].type).toBe(React.Fragment);
    expect(result[0].props.children).toBe(text);
  });

  test("обрабатывает пустую строку", () => {
    const result = linkifyText("");
    expect(result).toBe("");
  });

  test("обрабатывает null и undefined", () => {
    expect(linkifyText(null)).toBe(null);
    expect(linkifyText(undefined)).toBe("");
  });

  test("обрабатывает смешанный контент", () => {
    const text = "Код: `npm install` и ссылка: https://npmjs.com";
    const result = linkifyText(text);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe(React.Fragment);
    expect(result[0].props.children).toHaveLength(3);
    expect(result[0].props.children[0]).toBe("Код: ");
    expect(result[0].props.children[1].type).toBe("code");
    expect(result[0].props.children[2]).toBe(" и ссылка: ");
    expect(result[1].type).toBe("a");
  });
});
