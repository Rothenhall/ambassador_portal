"use client";

import { useState } from "react";
import { useActionRunner } from "@/components/use-action-runner";
import { ActionNote } from "@/components/ActionNote";
import { Avatar } from "@/components/ui/Misc";
import { Toggle } from "@/components/ui/Toggle";
import { IconArrowUpRight } from "@/components/icons";
import { updateProfile, setVisibility } from "@/lib/actions/profile";
import { PasswordForm } from "@/components/PasswordForm";
import type { AmbassadorDashboardData } from "@/lib/dashboard";

export function CirclePanel({
  me,
  directory,
  leaderboard,
  myRank,
  cohortSize,
}: {
  me: AmbassadorDashboardData["user"];
  directory: AmbassadorDashboardData["directory"];
  leaderboard: AmbassadorDashboardData["leaderboard"];
  myRank: number;
  cohortSize: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-5">
        <ProfileCard me={me} />

        <div>
          <p className="eyebrow mb-2.5 !text-[0.6rem]">Directory · opted in</p>
          {directory.length === 0 ? (
            <p className="text-sm text-ink-45">Nobody has opted into the directory yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {directory.map((m) => (
                <div key={m.id} className="flex items-start gap-2.5 rounded-sm2 border border-line bg-paper p-3">
                  <Avatar name={m.name} color={m.avatarColor} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                    <p className="truncate text-xs text-ink-45">{m.campusName}</p>
                    {m.pageUrl && (
                      <a href={m.pageUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 border-0 text-xs text-cognac-deep hover:underline">
                        {m.pageUrl.replace(/^https?:\/\//, "")} <IconArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="card p-4">
          <p className="eyebrow mb-2 !text-[0.6rem]">Password</p>
          <PasswordForm hasPassword={me.hasPassword} email={me.email} />
        </div>

        <div className="card p-3.5">
          <p className="eyebrow !text-[0.6rem]">Your rank</p>
          <p className="font-display text-2xl">
            {myRank}
            <span className="text-base text-ink-45"> of {cohortSize}</span>
          </p>
        </div>
        <div className="card p-3.5">
          <p className="eyebrow mb-2 !text-[0.6rem]">Leaderboard</p>
          {leaderboard.length === 0 ? (
            <p className="text-xs text-ink-45">Nobody has opted in yet.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {leaderboard.map((m, i) => (
                <li key={m.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="w-4 text-xs text-ink-45">{i + 1}</span>
                  <Avatar name={m.name} color={m.avatarColor} size={22} />
                  <span className={`flex-1 truncate ${m.id === me.id ? "font-medium text-ink" : "text-ink-60"}`}>{m.name}</span>
                  <span className="text-xs font-medium text-ink">{m.signalTotal}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ me }: { me: AmbassadorDashboardData["user"] }) {
  const [editing, setEditing] = useState(false);
  const { run, status, pending } = useActionRunner();
  const [pageUrl, setPageUrl] = useState(me.pageUrl ?? "");
  const [lane, setLane] = useState(me.lane ?? "");
  const [bio, setBio] = useState(me.bio ?? "");

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar name={me.name} color={me.avatarColor} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-lg leading-tight">{me.name}</p>
            <button onClick={() => setEditing((v) => !v)} className="text-xs font-medium text-cognac-deep hover:underline">
              {editing ? "Close" : "Edit"}
            </button>
          </div>
          <p className="text-xs text-ink-45">{me.email}</p>
          <a href="/home/letter" target="_blank" rel="noreferrer" className="link-line mt-1 inline-block border-0 text-xs font-medium text-cognac-deep">
            Your appointment letter &rarr;
          </a>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <input className="input" placeholder="Your page URL" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} />
          <input className="input" placeholder="Lane" value={lane} onChange={(e) => setLane(e.target.value)} />
          <textarea className="input" rows={2} placeholder="Short bio" value={bio} onChange={(e) => setBio(e.target.value)} />

          <div className="flex flex-col gap-2 rounded-sm2 border border-line bg-canvas-2/30 p-3">
            <VisibilityRow label="Show me in the directory" initial={me.showInDirectory} field="showInDirectory" />
            <VisibilityRow label="Show me on the leaderboard" initial={me.showOnLeaderboard} field="showOnLeaderboard" />
          </div>

          <button
            className="btn-primary btn-sm self-start"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const fd = new FormData();
                fd.set("pageUrl", pageUrl);
                fd.set("lane", lane);
                fd.set("bio", bio);
                const result = await updateProfile(fd);
                if (result.ok) setEditing(false);
                return result;
              })
            }
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <ActionNote status={status} />
        </div>
      ) : (
        me.lane && <p className="mt-2 text-sm text-ink-60">{me.lane}</p>
      )}
    </div>
  );
}

function VisibilityRow({ label, initial, field }: { label: string; initial: boolean; field: "showInDirectory" | "showOnLeaderboard" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-60">{label}</span>
      <Toggle initial={initial} onChange={(v) => setVisibility(field, v)} />
    </div>
  );
}
