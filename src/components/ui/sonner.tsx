"use client";

import { useTheme } from "next-themes";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";
import {
  CircleCheck,
  Info,
  Loader2,
  XOctagon,
  AlertTriangle,
} from "lucide-react";

/**
 * Sonner Toaster wrapper:
 * - Uses next-themes to pass theme
 * - Enables richColors (lets sonner show colored variants by default)
 * - Registers icons for variants
 * - Exposes some CSS variables via style that you can override in your global CSS
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // Enables Sonner's richer color variants (success/red/blue/yellow)
      richColors
      // Provide icons (lucide) — feel free to swap icons
      icons={{
        success: <CircleCheck className="size-4" />,
        info: <Info className="size-4" />,
        warning: <AlertTriangle className="size-4" />,
        error: <XOctagon className="size-4" />,
        loading: <Loader2 className="size-4 animate-spin" />,
      }}
      // Small set of CSS variables to make things easy to override in CSS
      style={
        {
          // keep these generic — we'll override specific variants in CSS
          // Sonner will still apply its internal classes; our CSS will target
          // Sonner's data-* attributes to enforce colors.
          "--normal-bg": "var(--card-bg, theme(colors.gray.800))",
          "--normal-text": "var(--card-foreground, theme(colors.gray.100))",
          "--normal-border": "var(--card-border, theme(colors.gray.700))",
          // you can add more variables here if you want to use them inline
        } as React.CSSProperties
      }
      className="toaster"
      {...props}
    />
  );
};

export { Toaster };
