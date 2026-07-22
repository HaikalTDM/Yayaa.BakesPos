'use client'

import { useState, useCallback, useRef } from 'react'

export function useLongPress(
  onLongPress: () => void,
  onClick: () => void,
  delay = 1000,
) {
  const [isPressing, setIsPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPress = useRef(false)
  const onLongPressRef = useRef(onLongPress)
  const onClickRef = useRef(onClick)
  onLongPressRef.current = onLongPress
  onClickRef.current = onClick

  const start = useCallback(() => {
    isLongPress.current = false
    setIsPressing(true)
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      setIsPressing(false)
      onLongPressRef.current()
    }, delay)
  }, [delay])

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPressing(false)
    if (!isLongPress.current) {
      onClickRef.current()
    }
  }, [])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPressing(false)
  }, [])

  return {
    onPointerDown: start,
    onPointerUp: end,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    isPressing,
  }
}
