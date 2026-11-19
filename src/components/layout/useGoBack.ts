import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/**
 * Zurück zur vorherigen Seite. Wurde die Seite direkt geöffnet (keine Historie),
 * geht es zur übergeordneten Seite (fallback).
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
