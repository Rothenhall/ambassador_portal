"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Misc";
import { signOut } from "@/lib/actions/auth";
import { IconLogout, IconUser } from "@/components/icons";

export function UserMenu({
  name,
  role,
  color,
  profileHref,
}: {
  name: string;
  role: string;
  color: string;
  profileHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2.5 transition-colors hover:border-line-strong"
      >
        <Avatar name={name} color={color} size={30} />
        <span className="text-left leading-tight">
          <span className="block text-[0.8rem] font-medium text-ink">{name}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-sm2 border border-line bg-paper shadow-convex">
          <div className="border-b border-line px-3.5 py-2.5">
            <p className="text-sm font-medium text-ink">{name}</p>
            <p className="text-xs text-ink-45 capitalize">{role.replace("_", " ")}</p>
          </div>
          {profileHref && (
            <Link
              href={profileHref}
              className="flex items-center gap-2 border-0 px-3.5 py-2.5 text-sm text-ink-60 hover:bg-canvas-2"
            >
              <IconUser className="h-4 w-4" /> Your profile
            </Link>
          )}
          <form action={signOut}>
            <button className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-cognac-deep hover:bg-canvas-2">
              <IconLogout className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
