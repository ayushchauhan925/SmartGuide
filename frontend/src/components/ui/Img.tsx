import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  /** Fill the nearest positioned parent (like next/image `fill`) */
  fill?: boolean;
  /** Load eagerly with high priority (above-the-fold images) */
  priority?: boolean;
}

/** Thin <img> wrapper keeping the familiar `fill` / `priority` props. */
export default function Img({ fill, priority, className, loading, ...props }: ImgProps) {
  return (
    <img
      {...props}
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  );
}
