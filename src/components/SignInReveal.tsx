"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.23, 1, 0.32, 1] as const;

export function SignInReveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease }}
      className="relative flex flex-col gap-6"
    >
      {children}
    </motion.div>
  );
}

export function SignInRow({ children }: { children: ReactNode }) {
  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease }}
      className="flex w-full items-center gap-3 rounded-sm2 border border-line bg-paper/80 px-3.5 py-3 text-left shadow-soft
        transition-colors duration-base hover:border-cognac/40 hover:bg-paper"
    >
      {children}
    </motion.button>
  );
}
