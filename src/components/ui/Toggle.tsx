"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";

export function Toggle({
  initial,
  onChange,
}: {
  initial: boolean;
  onChange: (value: boolean) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <motion.button
      role="switch"
      aria-checked={value}
      disabled={pending}
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        const next = !value;
        setValue(next);
        startTransition(async () => onChange(next));
      }}
      animate={{ backgroundColor: value ? "#9a7a4a" : "#cbc0a9" }}
      transition={{ duration: 0.3 }}
      className="relative h-6 w-11 shrink-0 rounded-full border-0"
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}
