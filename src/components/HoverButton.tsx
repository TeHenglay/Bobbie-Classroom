"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className, children, ...props }) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [isListening, setIsListening] = React.useState(false)
    const [circles, setCircles] = React.useState<Array<{
      id: number
      x: number
      y: number
      color: string
      fadeState: "in" | "out" | null
    }>>([])
    const lastAddedRef = React.useRef(0)

    const createCircle = React.useCallback((x: number, y: number) => {
      const buttonWidth = buttonRef.current?.offsetWidth || 0
      const xPos = x / buttonWidth
      const color = `linear-gradient(to right, var(--circle-start) ${xPos * 100}%, var(--circle-end) ${
        xPos * 100
      }%)`

      setCircles((prev) => [
        ...prev,
        { id: Date.now(), x, y, color, fadeState: null },
      ])
    }, [])

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isListening) return
        
        const currentTime = Date.now()
        if (currentTime - lastAddedRef.current > 100) {
          lastAddedRef.current = currentTime
          const rect = event.currentTarget.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          createCircle(x, y)
        }
      },
      [isListening, createCircle]
    )

    const handlePointerEnter = React.useCallback(() => {
      setIsListening(true)
    }, [])

    const handlePointerLeave = React.useCallback(() => {
      setIsListening(false)
    }, [])

    React.useEffect(() => {
      circles.forEach((circle) => {
        if (!circle.fadeState) {
          setTimeout(() => {
            setCircles((prev) =>
              prev.map((c) =>
                c.id === circle.id ? { ...c, fadeState: "in" } : c
              )
            )
          }, 0)

          setTimeout(() => {
            setCircles((prev) =>
              prev.map((c) =>
                c.id === circle.id ? { ...c, fadeState: "out" } : c
              )
            )
          }, 1000)

          setTimeout(() => {
            setCircles((prev) => prev.filter((c) => c.id !== circle.id))
          }, 2200)
        }
      })
    }, [circles])

    return (
      <button
        ref={buttonRef}
        className={cn(
          "relative isolate px-8 py-3 rounded-full",
          "text-white font-semibold text-base leading-6",
          "backdrop-blur-lg",
          "bg-gradient-to-r from-purple-600 via-purple-700 to-blue-700",
          "cursor-pointer overflow-hidden",
          "shadow-[0_0_20px_rgba(139,92,246,0.3)]",
          "before:content-[''] before:absolute before:inset-0",
          "before:rounded-[inherit] before:pointer-events-none",
          "before:z-[1]",
          "before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent",
          "before:transition-transform before:duration-300",
          "active:before:scale-[0.975]",
          "hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]",
          "hover:scale-105",
          "transition-all duration-300 ease-out",
          className
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
        style={{
          "--circle-start": "var(--tw-gradient-from, #c4b5fd)",
          "--circle-end": "var(--tw-gradient-to, #a78bfa)",
        } as React.CSSProperties}
      >
        {circles.map(({ id, x, y, fadeState }) => (
          <div
            key={id}
            className={cn(
              "absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full",
              "pointer-events-none z-0 transition-opacity",
              fadeState === "in" && "opacity-60 duration-500",
              fadeState === "out" && "opacity-0 duration-[1.5s]",
              !fadeState && "opacity-0"
            )}
            style={{
              left: x,
              top: y,
              background: `radial-gradient(circle, rgba(196, 181, 253, 0.4) 0%, rgba(167, 139, 250, 0.2) 40%, transparent 70%)`,
              filter: "blur(20px)",
            }}
          />
        ))}
        {children}
      </button>
    )
  }
)

HoverButton.displayName = "HoverButton"

export { HoverButton }
