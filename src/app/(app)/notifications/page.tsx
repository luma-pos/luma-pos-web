import Link from "next/link";
import { Activity, Bot, CheckCircle2, Clock, Filter, Info, ShieldAlert, UserRound, XCircle } from "lucide-react";
import { getAuditLogs, type AuditSource, type AuditStatus } from "@/lib/audit";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SOURCES: AuditSource[] = ["manual", "ai", "mobile", "pos", "system"];
const STATUSES: AuditStatus[] = ["previewed", "confirmed", "succeeded", "failed", "cancelled", "unauthorized"];

function validSource(value?: string): AuditSource | undefined {
  return SOURCES.includes(value as AuditSource) ? value as AuditSource : undefined;
}

function validStatus(value?: string): AuditStatus | undefined {
  return STATUSES.includes(value as AuditStatus) ? value as AuditStatus : undefined;
}

function iconFor(source: AuditSource, status: AuditStatus) {
  if (status === "failed" || status === "unauthorized") return ShieldAlert;
  if (status === "cancelled") return XCircle;
  if (status === "previewed" || status === "confirmed") return Clock;
  if (source === "ai") return Bot;
  return CheckCircle2;
}

function toneFor(status: AuditStatus) {
  return status === "succeeded"
    ? "bg-ok-soft text-ok"
    : status === "failed" || status === "unauthorized"
      ? "bg-er-soft text-er"
      : status === "cancelled"
        ? "bg-surface-2 text-slate-500"
        : "bg-warn-soft text-warn";
}

function sourceTone(source: AuditSource) {
  return source === "ai"
    ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
    : source === "mobile"
      ? "bg-in-soft text-in"
      : source === "pos"
        ? "bg-ok-soft text-ok"
        : "bg-surface-2 text-slate-500";
}

function titleFor(row: Awaited<ReturnType<typeof getAuditLogs>>[number]) {
  return `${row.action.replaceAll("_", " ")} · ${row.entityType}`;
}

function paramsWith(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/notifications?${query}` : "/notifications";
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const source = validSource(params.source);
  const status = validStatus(params.status);
  const rows = await getAuditLogs({
    source,
    status,
    action: params.action,
    entityType: params.entityType,
    limit: 100,
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-5 bg-surface border-b border-border">
        <div className="min-h-13 px-4 sm:px-6 pt-2.5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          <div>
            <h1 className="text-[17px] font-bold leading-tight">Lịch sử hoạt động</h1>
            <p className="text-[11px] text-slate-400">Audit log cho thao tác thủ công, mobile, POS và AI</p>
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Bộ lọc
          </span>
          <Link className={cn("px-2.5 py-1 rounded-full border text-xs font-medium", !source ? "bg-primary-50 border-primary-100 text-primary-700" : "border-border text-slate-500")} href={paramsWith(params, { source: undefined })}>Tất cả nguồn</Link>
          {SOURCES.map((item) => (
            <Link key={item} className={cn("px-2.5 py-1 rounded-full border text-xs font-medium capitalize", source === item ? "bg-primary-50 border-primary-100 text-primary-700" : "border-border text-slate-500")} href={paramsWith(params, { source: item })}>{item}</Link>
          ))}
          <Link className={cn("px-2.5 py-1 rounded-full border text-xs font-medium", !status ? "bg-surface-2 border-border text-slate-700" : "border-border text-slate-500")} href={paramsWith(params, { status: undefined })}>Tất cả trạng thái</Link>
          {STATUSES.map((item) => (
            <Link key={item} className={cn("px-2.5 py-1 rounded-full border text-xs font-medium", status === item ? "bg-surface-2 border-border text-slate-700" : "border-border text-slate-500")} href={paramsWith(params, { status: item })}>{item}</Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-card p-12 text-center text-slate-400">
          <Info className="w-10 h-10 mx-auto mb-3 opacity-60" />
          <p className="font-medium">Chưa có hoạt động phù hợp.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-card shadow-e1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-sm">
              <thead>
                <tr className="bg-canvas text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-border">
                  <th className="px-4 py-2.5 font-bold">Hoạt động</th>
                  <th className="px-4 py-2.5 font-bold">Nguồn</th>
                  <th className="px-4 py-2.5 font-bold">Trạng thái</th>
                  <th className="px-4 py-2.5 font-bold">Người thực hiện</th>
                  <th className="px-4 py-2.5 font-bold">Thời gian</th>
                  <th className="px-4 py-2.5 font-bold">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const Icon = iconFor(row.source, row.status);
                  return (
                    <tr key={row.id} className="border-b border-border-soft last:border-0 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-9 h-9 rounded-xl grid place-items-center shrink-0", toneFor(row.status))}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold capitalize">{titleFor(row)}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{row.entityId ?? "—"}</div>
                            {row.prompt && <div className="text-xs text-slate-500 mt-1 line-clamp-2">Prompt: {row.prompt}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize", sourceTone(row.source))}>{row.source}</span></td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", toneFor(row.status))}>{row.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <UserRound className="w-3.5 h-3.5" />
                          <span>{row.actorNameSnapshot ?? row.actorId ?? "System"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3 max-w-96">
                        <details className="text-xs">
                          <summary className="cursor-pointer font-semibold text-primary-600">Xem metadata</summary>
                          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-canvas p-3 text-[11px] leading-relaxed text-slate-600">{JSON.stringify({
                            parsedIntent: row.parsedIntent,
                            before: row.before,
                            after: row.after,
                            affectedRecords: row.affectedRecords,
                            metadata: row.metadata,
                          }, null, 2)}</pre>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
