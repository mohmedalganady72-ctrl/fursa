import { cn } from "@/lib/utils";

export function PlatformLoader({ message = "نجهّز فٌرصتك", fullScreen = true }: { message?: string; fullScreen?: boolean }) {
  return <div className={cn("flex items-center justify-center bg-background", fullScreen ? "min-h-screen" : "min-h-72")} role="status" aria-label={message}>
    <div className="text-center">
      <div className="relative mx-auto h-20 w-20">
        <span className="loader-orbit absolute inset-0 rounded-full border border-primary-200" />
        <svg viewBox="0 0 44 44" className="absolute inset-4 h-12 w-12 text-primary-700" aria-hidden="true">
          <path d="M7 35V18C7 10.8 12.8 5 20 5h10v7H20c-3.3 0-6 2.7-6 6v17H7Z" fill="currentColor" />
          <path d="M19 35V23c0-4.4 3.6-8 8-8h10v7H27a1 1 0 0 0-1 1v12h-7Z" fill="currentColor" opacity=".72" />
          <circle cx="34" cy="7" r="4" className="loader-dot fill-accent-500" />
        </svg>
      </div>
      <p className="mt-5 font-heading text-h4 text-neutral-800">{message}</p>
      <div className="mx-auto mt-3 flex w-24 items-center justify-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => <span key={index} className="loader-pulse h-1.5 w-6 rounded-full bg-primary-500" style={{ animationDelay: `${index * 140}ms` }} />)}
      </div>
    </div>
  </div>;
}
