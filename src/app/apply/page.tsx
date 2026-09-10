"use client";

import { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitApplication, type ApplyState } from "@/lib/actions/apply";
import { IconCheck } from "@/components/icons";

const initialState: ApplyState = { ok: false };
const ease = [0.22, 1, 0.36, 1] as const;

export default function ApplyPage() {
  const [state, formAction, pending] = useActionState(submitApplication, initialState);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-xl px-6 py-16 sm:px-8">
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="eyebrow">
          Rothenhall Partners
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease }}
          className="mt-2 font-display text-3xl"
        >
          Campus Circle, Cohort 01
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5, ease }}
          className="mt-3 text-ink-60"
        >
          Twelve weeks. Four to six hours a week. No monetary compensation. A certificate that verifies at a public
          URL, a byline on this domain if you make Campus Lead, and a letter that names what you actually did.
        </motion.p>

        <AnimatePresence mode="wait">
          {state.ok ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="mt-8 flex flex-col items-center gap-3 rounded-sm2 border border-[#3f6b4a]/25 bg-[#3f6b4a]/5 px-6 py-10 text-center"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 18 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3f6b4a]/10 text-[#3f6b4a]"
              >
                <IconCheck className="h-5 w-5" />
              </motion.span>
              <p className="font-display text-lg">Sent.</p>
              <p className="max-w-xs text-sm text-ink-60">
                We read every application. If it's a fit, an invite and a login arrive by email, no other action needed
                from you.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              action={formAction}
              className="mt-8 flex flex-col gap-5"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
                <input name="name" className="input" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
                <input name="email" type="email" className="input" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Campus</label>
                <input name="campus" className="input" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Field you'd write about</label>
                <input name="field" className="input" required />
              </div>

              <div className="rounded-sm2 border border-line bg-canvas-2/50 p-4">
                <p className="text-sm font-medium text-ink">The one task</p>
                <p className="mt-1 text-sm text-ink-60">
                  Open ChatGPT or Claude. Ask it: <em>"Who are the best people to follow on [your field] in [your
                  city]?"</em> In 150 words, tell us what you noticed about who it named and who it did not.
                </p>
              </div>
              <div>
                <textarea name="answerText" className="input min-h-[10rem]" placeholder="What you noticed..." required />
              </div>

              <AnimatePresence>
                {state.error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-cognac-deep"
                  >
                    {state.error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn-primary self-start" disabled={pending}>
                {pending ? "Sending..." : "Apply"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
