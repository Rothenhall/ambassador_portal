export const SIGNAL_TOTAL = 1000;

export const BANDS = [
  { floor: 0, label: "Invisible" },
  { floor: 251, label: "Faint" },
  { floor: 501, label: "Present" },
  { floor: 751, label: "Recommended" },
] as const;

export function bandFor(signal: number) {
  let current = BANDS[0];
  for (const b of BANDS) if (signal >= b.floor) current = b;
  return current.label;
}

export const TRACKS = {
  A: { name: "Foundation", color: "brass", total: 150 },
  B: { name: "Craft", color: "cognac", total: 300 },
  C: { name: "Campus", color: "brass-deep", total: 300 },
  D: { name: "The Standard", color: "ink-60", total: 150 },
  E: { name: "Measure", color: "cognac-deep", total: 100 },
} as const;

export type TrackKey = keyof typeof TRACKS;

// The loop the five tracks form: Learn -> Build -> Publish -> Amplify -> Measure -> Learn.
export const LOOP_STAGES: { track: TrackKey; stage: string }[] = [
  { track: "D", stage: "Learn" },
  { track: "A", stage: "Build" },
  { track: "B", stage: "Publish" },
  { track: "C", stage: "Amplify" },
  { track: "E", stage: "Measure" },
];

export const TIER_ORDER = ["applicant", "ambassador", "senior", "campus_lead", "alumnus"] as const;

export function tierAtLeast(current: string, required: string) {
  const ci = TIER_ORDER.indexOf(current as (typeof TIER_ORDER)[number]);
  const ri = TIER_ORDER.indexOf(required as (typeof TIER_ORDER)[number]);
  return ci >= 0 && ri >= 0 && ci >= ri;
}

export function tierLabel(tier: string) {
  return (
    {
      applicant: "Applicant",
      ambassador: "Ambassador",
      senior: "Senior Ambassador",
      campus_lead: "Campus Lead",
      alumnus: "Alumnus",
    }[tier] ?? tier
  );
}
