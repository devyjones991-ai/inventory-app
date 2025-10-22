import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "../ThemeToggle";

// Мокаем localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Мокаем matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.removeAttribute("data-theme");
  });

  test("renders theme toggle with default props", () => {
    render(<ThemeToggle />);

    const toggle = screen.getByRole("checkbox");
    const container = document.querySelector(".toggle-switch");

    expect(toggle).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });

  test("renders without label when showLabel is false", () => {
    render(<ThemeToggle showLabel={false} />);

    const toggle = screen.getByRole("checkbox");
    const label = screen.queryByText("Светлая");

    expect(toggle).toBeInTheDocument();
    expect(label).not.toBeInTheDocument();
  });

  test("applies correct size classes", () => {
    const { rerender } = render(<ThemeToggle size="small" />);
    let toggleContainer = document.querySelector(".toggle-switch");
    expect(toggleContainer).toHaveClass("w-8", "h-8");

    rerender(<ThemeToggle size="large" />);
    toggleContainer = document.querySelector(".toggle-switch");
    expect(toggleContainer).toHaveClass("w-12", "h-12");
  });

  test("toggles theme on click", () => {
    render(<ThemeToggle />);

    const toggle = screen.getByRole("checkbox");

    // Изначально светлая тема
    expect(toggle).not.toBeChecked();

    // Кликаем для переключения на темную
    fireEvent.click(toggle);

    expect(toggle).toBeChecked();
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  test("loads saved theme from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("dark");

    render(<ThemeToggle />);

    const toggle = screen.getByRole("checkbox");

    expect(toggle).toBeChecked();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  test("uses system preference when no saved theme", () => {
    localStorageMock.getItem.mockReturnValue(null);
    window.matchMedia.mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<ThemeToggle />);

    const toggle = screen.getByRole("checkbox");

    expect(toggle).toBeChecked();
  });

  test("applies custom className", () => {
    render(<ThemeToggle className="custom-class" />);

    const container = document.querySelector(".toggle-switch");
    expect(container).toHaveClass("custom-class");
  });
});
