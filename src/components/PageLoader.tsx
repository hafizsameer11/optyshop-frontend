import React from 'react'

/** Shown while lazy route chunks load — keep minimal for fast paint */
const PageLoader: React.FC = () => (
    <div
        className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 bg-slate-50/80 px-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
    >
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-950" />
        <p className="text-sm font-medium text-slate-600">Loading…</p>
    </div>
)

export default PageLoader
