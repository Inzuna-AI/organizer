import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'

const SWIPE_PX = 90

interface Props {
  children: ReactNode
  /** Wischen nach links; ohne Funktion ist die Zeile nicht wischbar */
  onClear?: () => void
  label?: string
}

/** Zeile, die sich nach links wegwischen lässt (wie beim Einkaufszettel). Nach dem Wischen wird kein Klick ausgelöst. */
export function SwipeToClear({ children, onClear, label = 'Entfernen' }: Props) {
  const x = useMotionValue(0)
  const bgOpacity = useTransform(x, [-SWIPE_PX, -20, 0], [1, 0.4, 0])
  const swiped = useRef(false)

  if (!onClear) return <>{children}</>

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_PX || info.velocity.x < -600) onClear?.()
    setTimeout(() => (swiped.current = false), 50)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        aria-hidden="true"
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 flex items-center justify-end bg-red-600 pr-5 text-sm font-medium text-white"
      >
        {label}
      </motion.div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.8, right: 0 }}
        dragSnapToOrigin
        onDragStart={() => (swiped.current = true)}
        onDragEnd={onDragEnd}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        style={{ x, touchAction: 'pan-y' }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  )
}
