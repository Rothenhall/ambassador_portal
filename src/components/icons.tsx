// Small hand-drawn line-icon set. 1.6px stroke, 20/24 viewbox, no icon library dependency.
import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconHome(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}
export function IconTasks(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <path d="m5.3 7 1 1 1.6-1.8" />
      <path d="M13 6h7" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M13 17h7" />
    </svg>
  );
}
export function IconProgress(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
    </svg>
  );
}
export function IconGift(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M4 9h16v3.5H4z" fillOpacity="0" />
      <path d="M12 9v11M4 9h16" />
      <path d="M12 9c-1.2-3.2-6-3.4-6-.7 0 1.6 2.4 1.9 6 .7Z" />
      <path d="M12 9c1.2-3.2 6-3.4 6-.7 0 1.6-2.4 1.9-6 .7Z" />
    </svg>
  );
}
export function IconUsers(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.7-3 2.7-4.6 5.5-4.6s4.8 1.6 5.5 4.6" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.5 14.7c1.8.2 3.3 1.5 3.9 3.8" />
    </svg>
  );
}
export function IconBook(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5Z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5Z" />
    </svg>
  );
}
export function IconUser(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1-3.6 3.5-5.4 7-5.4s6 1.8 7 5.4" />
    </svg>
  );
}
export function IconInbox(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 13 6.5 5h11L20 13" />
      <path d="M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" />
      <path d="M4 13h5l1.3 2h3.4l1.3-2H20" />
    </svg>
  );
}
export function IconGrid(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}
export function IconSettings(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3" />
    </svg>
  );
}
export function IconLogout(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3" />
      <path d="M14 15.5 19 12l-5-3.5" />
      <path d="M19 12H9" />
    </svg>
  );
}
export function IconChevronRight(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
export function IconCheck(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}
export function IconX(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
export function IconLink(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M9 15 15 9" />
      <path d="M10.5 6.5 12 5a3.5 3.5 0 1 1 5 5l-1.5 1.5" />
      <path d="M13.5 17.5 12 19a3.5 3.5 0 1 1-5-5l1.5-1.5" />
    </svg>
  );
}
export function IconUpload(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M12 15V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}
export function IconTable(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 10h16M4 15h16M10 5v14" />
    </svg>
  );
}
export function IconSearch(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m19 19-4.3-4.3" />
    </svg>
  );
}
export function IconBell(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M6 10.5a6 6 0 1 1 12 0c0 4 1.2 5.4 1.5 6H4.5c.3-.6 1.5-2 1.5-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
export function IconArrowUpRight(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}
export function IconPlus(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function IconFlame(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M12 3c1 3-3 4.5-3 8a3 3 0 0 0 6 0c1 .6 1.5 1.8 1.5 3a4.5 4.5 0 0 1-9 0C7.5 9.5 10 8 12 3Z" />
    </svg>
  );
}
