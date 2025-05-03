"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface AnimatedContainerProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  animation?: "fade" | "slide" | "scale" | "none"
  once?: boolean
}

export function AnimatedContainer({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  animation = "fade",
  once = true,
}: AnimatedContainerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && ref.current) {
            observer.unobserve(ref.current)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      {
        threshold: 0.1,
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [once])

  const getAnimationVariants = () => {
    switch (animation) {
      case "fade":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration, delay } },
        }
      case "slide":
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration, delay } },
        }
      case "scale":
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1, transition: { duration, delay } },
        }
      case "none":
      default:
        return {
          hidden: {},
          visible: {},
        }
    }
  }

  return (
    <div ref={ref} className={className}>
      <AnimatePresence>
        {(isVisible || animation === "none") && (
          <motion.div initial="hidden" animate="visible" exit="hidden" variants={getAnimationVariants()}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
