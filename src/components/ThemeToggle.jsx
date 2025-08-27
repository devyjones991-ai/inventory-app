import React, { useState, useEffect } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

const THEME_KEY = 'theme'
const DEFAULT_THEME = 'light'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(THEME_KEY) || DEFAULT_THEME
    }
    return DEFAULT_THEME
  })

  // Устанавливаем выбранную тему при монтировании и при изменении
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, theme)
    }
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <Button
      size="sm"
      className="transition-none"
      onClick={toggleTheme}
      aria-label="Переключить тему"
    >
      {theme === 'light' ? (
        <MoonIcon className="w-4 h-4" />
      ) : (
        <SunIcon className="w-4 h-4" />
      )}
    </Button>
  )
}
