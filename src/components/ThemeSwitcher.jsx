import React, { useState, useEffect } from 'react'

const THEMES = ['light', 'dark', 'cupcake', 'retro', 'cyberpunk']

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    applyTheme(saved)
  }, [])

  function applyTheme(newTheme) {
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <div className="mb-4">
      <label htmlFor="theme-select" className="mr-2 font-medium">Тема:</label>
      <select
        id="theme-select"
        value={theme}
        onChange={e => applyTheme(e.target.value)}
        className="select select-bordered"
      >
        {THEMES.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  )
}
