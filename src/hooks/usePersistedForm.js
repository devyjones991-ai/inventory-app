import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'

export default function usePersistedForm(
  formKey,
  defaultValues,
  isOpen,
  options = {},
) {
  const form = useForm({ defaultValues, ...options })
  const { reset, watch } = form
  const wasOpen = useRef(false)

  useEffect(() => {
    if (!formKey) return
    let parsed = defaultValues
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(formKey)
      if (saved) {
        try {
          parsed = JSON.parse(saved)
        } catch {
          localStorage.removeItem(formKey)
        }
      }
    }
    reset(parsed)
    if (isOpen && typeof localStorage !== 'undefined') {
      localStorage.setItem(formKey, JSON.stringify(parsed))
    }
  }, [formKey, isOpen, reset, defaultValues])

  useEffect(() => {
    if (!formKey) return
    if (!isOpen) {
      if (wasOpen.current && typeof localStorage !== 'undefined') {
        localStorage.removeItem(formKey)
      }
      return
    }
    wasOpen.current = true
    const sub = watch((value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(formKey, JSON.stringify(value))
      }
    })
    return () => sub.unsubscribe()
  }, [formKey, isOpen, watch])

  return form
}
