'use client'
import { useEffect } from 'react'
import { useSpring, useTransform, useReducedMotion, m } from 'motion/react'
import { SPRING } from './variants'

export function NumberTicker({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion()
  const spring = useSpring(value, SPRING.count)
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())
  useEffect(() => {
    spring.set(value)
  }, [value, spring])
  if (reduce) return <span className={className}>{value}</span>
  return <m.span className={`font-mono tabular-nums ${className ?? ''}`}>{display}</m.span>
}
