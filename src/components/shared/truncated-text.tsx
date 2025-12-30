"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsTruncated } from "@/hooks/use-is-truncated";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  className?: string;
}

/**
 * Text component that shows a tooltip when content is truncated.
 * Uses CSS text-overflow: ellipsis and detects truncation automatically.
 */
export function TruncatedText({ text, className }: TruncatedTextProps) {
  const [ref, isTruncated] = useIsTruncated<HTMLSpanElement>(text);

  const textElement = (
    <span ref={ref} className={cn("block truncate", className)}>
      {text}
    </span>
  );

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{textElement}</TooltipTrigger>
        <TooltipContent side="top">{text}</TooltipContent>
      </Tooltip>
    );
  }

  return textElement;
}
