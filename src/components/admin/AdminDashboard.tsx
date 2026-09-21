"use client";

import { useMemo, useState } from "react";
import { UserMenu } from "@/components/shell/UserMenu";
import { TabSwitcher } from "@/components/shell/TabSwitcher";
import { Drawer } from "@/components/shell/Drawer";
import { LogoLockup } from "@/components/brand/Logo";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { ReviewQueueClient } from "@/components/admin/ReviewQueueClient";
import { AmbassadorsPanel } from "@/components/admin/AmbassadorsPanel";
import { AmbassadorDrawerContent } from "@/components/admin/AmbassadorDrawerContent";
import { AdminTasksPanel } from "@/components/admin/TasksPanel";
import { ApplicationsPanel } from "@/components/admin/ApplicationsPanel";
import { AdminRewardsPanel } from "@/components/admin/RewardsPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { TaskEditor } from "@/components/admin/TaskEditor";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

export function AdminDashboard({
  data,
  admin,
}: {
  data: AdminDashboardData;
  admin: { id: string; name: string; email: string; role: string; avatarColor: string; hasPassword: boolean };
}) {
  const [tab, setTab] = useState("overview");
  const [openAmbassadorId, setOpenAmbassadorId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null | undefined>(undefined);

  const openAmbassador = useMemo(() => data.ambassadors.find((a) => a.id === openAmbassadorId) ?? null, [data.ambassadors, openAmbassadorId]);
  const isAdmin = admin.role === "admin";
  const pendingApplications = data.applications.filter((a) => a.status === "pending").length;
  const pendingFulfilment = data.rewardGrants.filter((g) => g.status === "claimed").length;

  const tabs = [
    { key: "overview", label: "Overview", panel: <OverviewPanel data={data} onOpenReview={() => setTab("review")} /> },
    { key: "review", label: "Review", badge: data.stats.pendingCount, panel: <ReviewQueueClient items={data.reviewQueue} me={{ id: admin.id, name: admin.name, role: admin.role }} /> },
    { key: "ambassadors", label: "Ambassadors", panel: <AmbassadorsPanel ambassadors={data.ambassadors} onOpen={setOpenAmbassadorId} canManage={isAdmin} cohorts={data.cohorts} campuses={data.campuses} /> },
    { key: "tasks", label: "Tasks", panel: <AdminTasksPanel tasks={data.tasks} canPublish={isAdmin} canEdit={isAdmin} onEdit={setOpenTaskId} /> },
    { key: "applications", label: "Applications", badge: pendingApplications, panel: <ApplicationsPanel applications={data.applications} canDecide={isAdmin} /> },
    { key: "rewards", label: "Rewards", badge: pendingFulfilment, panel: <AdminRewardsPanel grants={data.rewardGrants} canFulfil={isAdmin} /> },
    { key: "settings", label: "Settings", panel: <SettingsPanel data={data} role={admin.role} meId={admin.id} meEmail={admin.email} hasPassword={admin.hasPassword} /> },
  ];

  return (
    <div className="ground flex h-screen flex-col overflow-hidden">
      <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-line/70 bg-canvas/70 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <LogoLockup height={18} />
          <span className="eyebrow rounded-full border border-line-strong bg-paper/60 px-2.5 py-1 !text-[0.56rem] text-ink-45">Operator</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="eyebrow !text-[0.58rem] text-ink-45">
            {data.cohort.name} · Week {data.cohort.week}
          </span>
          <div className="h-4 w-px bg-line" />
          <UserMenu name={admin.name} role={admin.role} color={admin.avatarColor} />
        </div>
      </header>

      <main id="main" className="flex-1 overflow-y-auto">
        <TabSwitcher tabs={tabs} active={tab} onChange={setTab} label="Operator sections" />
      </main>

      <Drawer open={!!openAmbassador} onClose={() => setOpenAmbassadorId(null)} eyebrow="Ambassador" title={openAmbassador?.name}>
        {openAmbassador && <AmbassadorDrawerContent ambassador={openAmbassador} canAdmin={isAdmin} me={{ id: admin.id, role: admin.role }} />}
      </Drawer>

      <Drawer
        open={openTaskId !== undefined}
        onClose={() => setOpenTaskId(undefined)}
        eyebrow={openTaskId ? "Edit task" : "New brief"}
        title={openTaskId ? data.tasks.find((t) => t.id === openTaskId)?.title ?? "Task" : "New task"}
      >
        {openTaskId !== undefined && (
          <TaskEditor
            task={openTaskId ? data.tasks.find((t) => t.id === openTaskId) ?? null : null}
            cohorts={data.cohorts}
            defaultCohortId={data.cohort.id}
            onDone={() => setOpenTaskId(undefined)}
            onCancel={() => setOpenTaskId(undefined)}
          />
        )}
      </Drawer>
    </div>
  );
}
