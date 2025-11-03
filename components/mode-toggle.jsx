"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700"
        aria-label="Toggle theme"
        disabled
      />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-orange-300" />
      ) : (
        <Moon className="h-5 w-5 text-slate-800" />
      )}
    </button>
  )
}
