import type { TaskConfig } from "@/lib/tasks";
import { LinkForm } from "@/components/forms/LinkForm";
import { LinkSetForm } from "@/components/forms/LinkSetForm";
import { DocumentForm } from "@/components/forms/DocumentForm";
import { UploadForm } from "@/components/forms/UploadForm";
import { StructuredForm } from "@/components/forms/StructuredForm";
import { RosterForm } from "@/components/forms/RosterForm";
import { QuizForm } from "@/components/forms/QuizForm";

export function SubmissionForm({
  taskId,
  type,
  config,
  initial,
}: {
  taskId: string;
  type: string;
  config: TaskConfig;
  initial?: Record<string, any>;
}) {
  switch (type) {
    case "link":
      return <LinkForm taskId={taskId} label={config.link?.label ?? "URL"} placeholder={config.link?.placeholder ?? "https://"} initial={initial} />;
    case "link_set":
      return <LinkSetForm taskId={taskId} rows={config.link_set?.rows ?? []} initial={initial} />;
    case "document":
      return (
        <DocumentForm
          taskId={taskId}
          minWords={config.document?.minWords ?? 0}
          maxWords={config.document?.maxWords ?? 10000}
          placeholder={config.document?.placeholder ?? ""}
          initial={initial}
        />
      );
    case "upload":
      return (
        <UploadForm
          taskId={taskId}
          maxFiles={config.upload?.maxFiles ?? 4}
          label={config.upload?.label ?? "Files"}
          captionLabel={config.upload?.captionLabel}
          initial={initial}
        />
      );
    case "structured":
      return (
        <StructuredForm
          taskId={taskId}
          columns={config.structured?.columns ?? []}
          minRows={config.structured?.minRows ?? 1}
          initial={initial}
        />
      );
    case "roster":
      return <RosterForm taskId={taskId} fields={config.roster?.fields ?? []} minRows={config.roster?.minRows ?? 1} initial={initial} />;
    case "quiz":
      return (
        <QuizForm
          taskId={taskId}
          questions={config.quiz?.questions ?? []}
          practicalPrompt={config.quiz?.practicalPrompt}
          initial={initial}
        />
      );
    default:
      return <p className="text-sm text-ink-45">Unsupported submission type.</p>;
  }
}
