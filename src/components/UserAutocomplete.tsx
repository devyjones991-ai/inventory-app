import React, { useState, useRef, useEffect } from "react";

import { useUsers } from "../hooks/useUsers";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface UserAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  id?: string;
  className?: string;
}

export default function UserAutocomplete({
  value,
  onChange,
  placeholder = "Введите имя пользователя...",
  label,
  error,
  id,
  className = "",
}: UserAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { users, loading } = useUsers();

  // Фильтруем пользователей по поисковому запросу
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  // Обновляем поисковый запрос при изменении value
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(newValue.length > 0);
    setSelectedIndex(-1);
  };

  const handleUserSelect = (user: {
    full_name?: string;
    email: string;
    username?: string;
  }) => {
    const displayName = user.full_name || user.username || user.email;
    setSearchTerm(displayName);
    onChange(displayName);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredUsers.length) {
          handleUserSelect(filteredUsers[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Не закрываем список, если клик был по списку
    if (listRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const getDisplayName = (user: {
    full_name?: string;
    email: string;
    username?: string;
  }) => {
    return user.full_name || user.username || user.email;
  };

  const getSubText = (user: {
    full_name?: string;
    email: string;
    username?: string;
  }) => {
    const parts = [];
    if (user.full_name && user.username) parts.push(user.username);
    if (user.email) parts.push(user.email);
    return parts.join(" • ");
  };

  return (
    <div className="relative">
      {label && (
        <Label htmlFor={id} className="text-space-text font-semibold">
          {label}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => searchTerm.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full space-input ${className}`}
        autoComplete="off"
      />

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-space-bg border border-space-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-3 text-center text-space-text-muted">
              <div className="text-2xl mb-2">⏳</div>
              Загрузка пользователей...
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={`w-full text-left p-3 hover:space-active transition-colors ${
                  index === selectedIndex ? "space-active" : ""
                }`}
                onClick={() => handleUserSelect(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="font-medium text-space-text">
                  {getDisplayName(user)}
                </div>
                <div className="text-sm text-space-text-muted">
                  {getSubText(user)}
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-space-text-muted">
              <div className="text-2xl mb-2">👤</div>
              Пользователи не найдены
            </div>
          )}
        </div>
      )}

      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
}
