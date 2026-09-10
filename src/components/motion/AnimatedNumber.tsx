"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

/** Counts smoothly to `value` whenever it changes, instead of snapping. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 0.6 });
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString("en-IN"));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  if (reduceMotion) return <span className={className}>{value.toLocaleString("en-IN")}</span>;
  return <motion.span className={className}>{rounded}</motion.span>;
}
