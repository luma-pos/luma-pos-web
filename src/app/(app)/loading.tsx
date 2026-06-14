/**
 * Skeleton hiện ngay khi chuyển trang (route động cần loading.tsx để Next prefetch
 * được layout shell → đổi trang thấy ngay khung thay vì trắng/chờ server query).
 */
export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      {/* header */}
      <div className="-mx-6 -mt-6 mb-5 min-h-[58px] px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-full max-w-sm rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* rows */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-4 flex-1 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-16 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
