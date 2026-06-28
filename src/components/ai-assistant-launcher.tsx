"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Info,
  Maximize2,
  MessageSquare,
  Minus,
  Send,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiActionPreview, AiAssistantState } from "@/lib/ai/actions";

type PreviewResolutionState = AiAssistantState | "confirmed" | "cancelled";
type AssistantSurface = "web" | "pos";

type Msg = {
  role: "user" | "assistant";
  text: string;
  state?: PreviewResolutionState;
  preview?: AiActionPreview;
  result?: string;
  record?: {
    type: string;
    id: string;
    code: string;
    href: string;
  };
};

type AssistantResponse = {
  text: string;
  state?: AiAssistantState;
  actionPreview?: AiActionPreview;
};

async function postJson(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error ?? `http.${res.status}`);
  }
  return json?.data ?? json;
}

function useAssistantState(surface: AssistantSurface) {
  const t = useTranslations();
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  const suggestions = surface === "pos"
    ? [
        "2 cà phê Robusta, 1 bánh mì thịt",
        "Tìm sản phẩm sắp hết trong giỏ",
        t("ai.q.lowStock"),
        t("ai.q.todaySales"),
      ]
    : [
        t("ai.q.todaySales"),
        t("ai.q.topSellers"),
        t("ai.q.lowStock"),
        t("ai.q.restockToday"),
        "Nhập 20 thùng cà phê Robusta vào kho chính",
        "Đặt giá SKU A là 120.000",
      ];

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const data = await postJson("/api/mobile/ai/assistant", { prompt: q }) as AssistantResponse;
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: data.text,
          state: data.state,
          preview: data.actionPreview,
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: e instanceof Error ? e.message : t("errors.serverError"),
          state: "failed",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function resolvePreview(index: number, event: "confirmed" | "cancelled") {
    const msg = msgs[index];
    if (!msg.preview || busy) return;
    setBusy(true);
    try {
      const result = await postJson("/api/mobile/ai/actions", {
        event,
        prompt: msg.preview.action.payload.prompt,
        actionPreview: msg.preview,
        surface,
      }) as {
        message?: string;
        record?: Msg["record"];
        status?: PreviewResolutionState;
      };
      setMsgs((m) => m.map((item, i) => i === index
        ? {
            ...item,
            state: result.status ?? event,
            result: result.message ?? (event === "confirmed" ? "Confirmed" : "Cancelled"),
            record: result.record,
          }
        : item));
    } catch (e) {
      setMsgs((m) => m.map((item, i) => i === index
        ? { ...item, state: "failed", result: e instanceof Error ? e.message : t("errors.serverError") }
        : item));
    } finally {
      setBusy(false);
    }
  }

  return {
    input,
    setInput,
    msgs,
    busy,
    suggestions,
    send,
    resolvePreview,
  };
}

export function AssistantWorkspace() {
  const t = useTranslations();
  const assistant = useAssistantState("web");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start gap-2 mb-4 px-3.5 py-2.5 bg-in-soft border border-in/20 rounded-card text-[12px] text-in">
        <Info className="w-4 h-4 shrink-0 mt-px" />
        <span>{t("ai.actionNotice")}</span>
      </div>

      <AssistantChatSurface
        assistant={assistant}
        mode="workspace"
        emptyText={t("ai.assistantEmpty")}
        placeholder={t("ai.askPlaceholder")}
      />
    </div>
  );
}

export function AiAssistantLauncher({ surface = "web" }: { surface?: AssistantSurface }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const assistant = useAssistantState(surface);
  const isPos = surface === "pos";

  if (open && !minimized) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-[54] bg-slate-950/30"
          aria-label={t("common.close")}
        />
        <section
          aria-label={t("ai.launcherTitle")}
          className={cn(
            "fixed z-[55] bg-surface border border-border shadow-e2 overflow-hidden flex flex-col",
            "inset-x-2 bottom-2 h-[min(85dvh,680px)] rounded-t-2xl rounded-b-card",
            "lg:inset-auto lg:top-4 lg:right-4 lg:bottom-4 lg:w-[430px] lg:max-w-[calc(100vw-2rem)] lg:rounded-card",
            isPos && "lg:top-16 lg:bottom-4"
          )}
        >
          <AssistantHeader
            surface={surface}
            onMinimize={() => setMinimized(true)}
            onClose={() => setOpen(false)}
          />
          <AssistantChatSurface
            assistant={assistant}
            mode="launcher"
            emptyText={isPos ? t("ai.posEmpty") : t("ai.assistantEmpty")}
            placeholder={isPos ? t("ai.posPlaceholder") : t("ai.askPlaceholder")}
          />
        </section>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setOpen(true);
        setMinimized(false);
      }}
      className={cn(
        "fixed z-[45] h-13 w-13 lg:h-14 lg:w-14 rounded-[18px] bg-primary-600 text-white shadow-e2 grid place-items-center",
        "hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isPos
          ? "left-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] lg:left-auto lg:right-5 lg:bottom-5"
          : "right-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] lg:right-5 lg:bottom-5"
      )}
      aria-label={t("ai.launcherTitle")}
      title={t("ai.launcherTitle")}
    >
      <Sparkles className="w-5 h-5" />
    </button>
  );
}

function AssistantHeader({
  surface,
  onMinimize,
  onClose,
}: {
  surface: AssistantSurface;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const isPos = surface === "pos";

  return (
    <div className="min-h-14 px-3.5 py-2.5 border-b border-border flex items-center justify-between gap-3 shrink-0">
      <div className="min-w-0 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-900 text-primary-700 dark:text-primary-300 grid place-items-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate">{isPos ? t("ai.posTitle") : t("ai.launcherTitle")}</div>
          <div className="text-[10.5px] font-semibold text-primary-600 truncate">{t("ai.launcherStatus")}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!isPos && (
          <a
            href="/ai?tab=assistant"
            className="hidden sm:grid w-8 h-8 place-items-center rounded-lg border border-border text-slate-500 hover:bg-surface-2"
            title={t("ai.openWorkspace")}
          >
            <Maximize2 className="w-4 h-4" />
          </a>
        )}
        <button
          type="button"
          onClick={onMinimize}
          className="w-8 h-8 grid place-items-center rounded-lg border border-border text-slate-500 hover:bg-surface-2"
          title={t("ai.minimize")}
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 grid place-items-center rounded-lg border border-border text-slate-500 hover:bg-surface-2"
          title={t("common.close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AssistantChatSurface({
  assistant,
  mode,
  emptyText,
  placeholder,
}: {
  assistant: ReturnType<typeof useAssistantState>;
  mode: "workspace" | "launcher";
  emptyText: string;
  placeholder: string;
}) {
  const { input, setInput, msgs, busy, suggestions, send, resolvePreview } = assistant;
  const compact = mode === "launcher";

  return (
    <div className={cn(
      "bg-surface border border-border rounded-card shadow-e1 flex flex-col min-h-0",
      compact ? "border-0 rounded-none shadow-none flex-1" : "h-[68vh]"
    )}>
      <div className={cn(
        "flex-1 overflow-y-auto flex flex-col gap-3 bg-canvas/50",
        compact ? "p-3" : "p-4"
      )}>
        {msgs.length === 0 ? (
          <div className="m-auto text-center text-slate-400 px-4">
            {compact ? (
              <MessageSquare className="w-9 h-9 mx-auto mb-3 opacity-60" />
            ) : (
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-60" />
            )}
            <p className="text-sm font-medium">{emptyText}</p>
          </div>
        ) : msgs.map((m, i) => (
          <div key={`${m.role}-${i}`} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
            <div className={cn(
              "px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
              compact ? "max-w-[88%]" : "max-w-[82%]",
              m.role === "user" ? "bg-primary-600 text-white rounded-tr-md" : "bg-surface border border-border rounded-tl-md"
            )}>
              {m.text}
            </div>
            {m.preview && (
              <PreviewCard
                preview={m.preview}
                state={m.state}
                result={m.result}
                record={m.record}
                busy={busy}
                compact={compact}
                onConfirm={() => resolvePreview(i, "confirmed")}
                onCancel={() => resolvePreview(i, "cancelled")}
              />
            )}
          </div>
        ))}
        {busy && <div className="self-start text-xs text-slate-400 px-3 py-2">Đang xử lý...</div>}
      </div>

      <div className={cn("px-3 pt-2 flex gap-1.5 overflow-x-auto", compact ? "shrink-0" : "flex-wrap")}>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            className="shrink-0 px-2.5 py-1 rounded-full border border-border text-xs text-slate-600 dark:text-slate-300 hover:bg-surface-2"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 flex items-center gap-2 border-t border-border mt-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2 text-sm rounded-full border border-border bg-canvas focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button disabled={busy} type="submit" className="w-9 h-9 grid place-items-center rounded-full bg-primary-600 text-white shrink-0 disabled:opacity-50" title="Send">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function PreviewCard({
  preview,
  state,
  result,
  record,
  busy,
  compact,
  onConfirm,
  onCancel,
}: {
  preview: AiActionPreview;
  state?: PreviewResolutionState;
  result?: string;
  record?: Msg["record"];
  busy: boolean;
  compact?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isConfirmed = state === "confirmed";
  const succeeded = state === "succeeded";
  const done = isConfirmed || succeeded || state === "cancelled";
  const canConfirm = preview.state === "preview" && preview.missingFields.length === 0;
  return (
    <div className={cn("w-full bg-surface border border-border rounded-card shadow-e1 overflow-hidden", compact ? "max-w-full" : "max-w-2xl")}>
      <div className="p-3 border-b border-border-soft flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">{preview.title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {preview.intent} · confidence {Math.round(preview.confidence * 100)}%
          </div>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
          preview.strongConfirmation ? "bg-warn-soft text-warn" : "bg-primary-50 text-primary-700"
        )}>
          {preview.strongConfirmation ? "Strong confirm" : "Preview"}
        </span>
      </div>
      <div className="p-3 space-y-3">
        <div className={cn("grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
          {preview.fields.map((field) => (
            <div key={field.label} className="rounded-lg bg-canvas border border-border-soft p-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">{field.label}</div>
              <div className={cn("text-sm font-semibold mt-0.5", field.tone === "warning" && "text-warn", field.tone === "danger" && "text-er")}>{field.value}</div>
            </div>
          ))}
        </div>
        {preview.lines.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            {preview.lines.map((line) => (
              <div key={`${line.label}-${line.value}`} className="flex items-start justify-between gap-3 p-2.5 border-b border-border-soft last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{line.label}</div>
                  {line.meta && <div className="text-[11px] text-slate-400 mt-0.5">{line.meta}</div>}
                </div>
                <div className={cn("text-sm font-mono font-bold shrink-0", line.tone === "danger" ? "text-er" : line.tone === "warning" ? "text-warn" : "text-primary-600")}>{line.value}</div>
              </div>
            ))}
          </div>
        )}
        {preview.missingFields.length > 0 && (
          <div className="rounded-lg bg-warn-soft text-warn p-2.5 text-xs font-semibold">
            Cần bổ sung: {preview.missingFields.join(", ")}
          </div>
        )}
        {preview.warnings.map((warning) => (
          <div key={warning} className="rounded-lg bg-surface-2 p-2.5 text-xs text-slate-500">{warning}</div>
        ))}
      </div>
      <div className={cn("p-3 bg-surface-2 border-t border-border flex gap-2", compact ? "flex-col" : "items-center justify-between")}>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400">{result ?? "Preview đã được ghi audit."}</div>
          {record && (
            <a href={record.href} className="mt-1 block text-xs font-bold text-primary-600 hover:underline">
              Mở PO nháp {record.code}
            </a>
          )}
        </div>
        {done ? (
          <span className={cn("inline-flex items-center gap-1 text-xs font-bold", isConfirmed || succeeded ? "text-ok" : "text-slate-500")}>
            {isConfirmed || succeeded ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {state}
          </span>
        ) : (
          <div className="flex gap-2 justify-end">
            <button disabled={busy} type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-slate-500 disabled:opacity-50">Hủy</button>
            <button disabled={busy || !canConfirm} type="button" onClick={onConfirm} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold disabled:opacity-50">Xác nhận</button>
          </div>
        )}
      </div>
    </div>
  );
}
