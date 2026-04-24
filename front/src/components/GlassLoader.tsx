import { ImageIcon } from "lucide-react";

type GlassProgressLoaderProps = {
  label?: string;
  className?: string;
  variant?: "compact" | "default" | "full";
  minHeight?: string;
};

type GlassListSkeletonProps = {
  rows?: number;
  className?: string;
  variant?: "compact" | "default" | "full";
  minHeight?: string;
};

type SkeletonBlockProps = {
  className?: string;
};

type ProductGridSkeletonProps = {
  count?: number;
  className?: string;
  minHeight?: string;
};

type AdminProductTableSkeletonProps = {
  rows?: number;
};

export const GlassProgressLoader = ({
  label,
  className = "",
  variant = "default",
  minHeight = "min-h-[300px]",
}: GlassProgressLoaderProps) => {
  const containerSize =
    variant === "compact" ? "rounded-xl p-3" : "rounded-2xl p-4";
  const titleWidth =
    variant === "full" ? "w-64" : variant === "compact" ? "w-40" : "w-48";
  const lineWidths =
    variant === "full"
      ? ["max-w-[480px]", "", "max-w-[440px]", "max-w-[460px]", "max-w-[360px]"]
      : variant === "compact"
        ? [
            "max-w-[320px]",
            "",
            "max-w-[290px]",
            "max-w-[260px]",
            "max-w-[300px]",
          ]
        : [
            "max-w-[360px]",
            "",
            "max-w-[330px]",
            "max-w-[300px]",
            "max-w-[340px]",
          ];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full animate-pulse ${containerSize} ${minHeight} flex flex-col justify-center ${className}`}
    >
      <div className="space-y-3.5">
        <SkeletonBlock
          className={`h-3 ${titleWidth} rounded-full mb-6 bg-neutral-quaternary`}
        />
        {lineWidths.map((width, index) => (
          <SkeletonBlock
            key={`progress-line-${index}`}
            className={`h-2.5 rounded-full ${width} ${index < lineWidths.length - 1 ? "mb-3" : ""} bg-neutral-quaternary`}
          />
        ))}
      </div>
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
};

export const GlassListSkeleton = ({
  rows = 4,
  className = "",
  variant = "default",
  minHeight = "min-h-[400px]",
}: GlassListSkeletonProps) => {
  const rowPadding =
    variant === "compact" ? "p-4" : variant === "full" ? "p-6" : "p-5";
  const titleWidth =
    variant === "compact" ? "w-32" : variant === "full" ? "w-56" : "w-44";
  const bodyWidth = variant === "full" ? "w-[94%]" : "w-4/5";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-3xl border border-white/60 dark:border-slate-700/70 bg-white/45 dark:bg-slate-900/55 backdrop-blur-xl overflow-hidden animate-pulse ${minHeight} ${className}`}
    >
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={`glass-row-${idx}`}
          className={`${rowPadding} border-b border-white/50 dark:border-slate-700/60 last:border-b-0`}
        >
          <div>
            <SkeletonBlock className={`h-4 ${titleWidth} rounded-full`} />
            <SkeletonBlock className="mt-3 h-3 w-full rounded-full" />
            <SkeletonBlock className={`mt-3 h-3 ${bodyWidth} rounded-full`} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SkeletonBlock = ({ className = "" }: SkeletonBlockProps) => {
  return <div className={`skeleton-base skeleton-shimmer ${className}`} />;
};

export const ProductCardSkeleton = ({
  count = 6,
  className = "",
  minHeight = "min-h-[400px]",
}: ProductGridSkeletonProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 animate-pulse ${minHeight} ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`product-skeleton-${idx}`}
          className="rounded-2xl overflow-hidden border border-gray-200/70 dark:border-slate-700/80 bg-white dark:bg-slate-900"
        >
          <div className="flex items-center justify-center w-full aspect-square bg-neutral-quaternary rounded-none">
            <ImageIcon className="w-9 h-9 text-fg-disabled" />
          </div>
          <div className="p-4 space-y-3">
            <SkeletonBlock className="h-3 w-3/4 rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-2.5 w-full rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-2.5 w-[92%] rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-2.5 w-4/5 rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-2.5 w-[86%] rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-2.5 w-2/3 rounded-full bg-neutral-quaternary" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const AdminProductTableSkeleton = ({
  rows = 10,
}: AdminProductTableSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={`admin-table-skeleton-${idx}`}>
          <td className="px-6 py-5">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="w-16 h-16 rounded-xl" />
              <div className="min-w-0 space-y-2.5">
                <SkeletonBlock className="h-4 w-48 rounded-md" />
                <SkeletonBlock className="h-3 w-32 rounded-md" />
              </div>
            </div>
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <SkeletonBlock className="h-4 w-24 rounded-md" />
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <SkeletonBlock className="h-4 w-16 rounded-md" />
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <SkeletonBlock className="h-4 w-20 rounded-md" />
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <SkeletonBlock className="h-4 w-24 rounded-md" />
          </td>
          <td className="px-6 py-5 whitespace-nowrap">
            <SkeletonBlock className="h-9 w-24 rounded-xl ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};

export const AdminDashboardSkeleton = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-6 md:space-y-10 pb-10 animate-pulse min-h-[800px]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-64 rounded-full bg-default" />
          <SkeletonBlock className="h-3 w-48 rounded-full bg-default" />
        </div>
        <div className="flex items-center justify-center">
          <SkeletonBlock className="w-32 h-11 rounded-xl bg-shopbee-blue/20" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`stats-skeleton-${idx}`}
            className="glass-card p-6 md:p-8 rounded-3xl"
          >
            <div className="flex items-center space-x-5">
              <SkeletonBlock className="w-16 h-16 rounded-2xl bg-neutral-quaternary" />
              <div className="space-y-3">
                <SkeletonBlock className="h-3 w-24 rounded-full bg-neutral-quaternary" />
                <SkeletonBlock className="h-5 w-32 rounded-full bg-neutral-quaternary" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-center w-full h-64 bg-neutral-quaternary rounded-base">
            <ImageIcon className="w-16 h-16 text-fg-disabled" />
          </div>
          <div className="space-y-4">
            <SkeletonBlock className="h-4 w-64 rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-3 w-full rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-3 w-[94%] rounded-full bg-neutral-quaternary" />
            <SkeletonBlock className="h-3 w-[88%] rounded-full bg-neutral-quaternary" />
          </div>
        </div>
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <SkeletonBlock className="h-6 w-40 rounded-md bg-neutral-quaternary mb-2" />
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonBlock
              key={`rank-skeleton-${idx}`}
              className="h-14 w-full rounded-xl bg-neutral-quaternary"
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};



