"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  type SoundSettings,
  type TypingSoundKind,
  useTypingSounds,
} from "../_lib/typing-sounds";

type SelectSoundLinkProps = {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  href: string;
  soundSettings?: SoundSettings;
  soundKind?: Extract<TypingSoundKind, "select" | "back">;
  title?: string;
};

export function SelectSoundLink({
  "aria-label": ariaLabel,
  children,
  className,
  href,
  soundSettings,
  soundKind = "select",
  title,
}: SelectSoundLinkProps) {
  const playTypingSound = useTypingSounds(soundSettings);

  return (
    <Link
      aria-label={ariaLabel}
      className={className}
      href={href}
      onClick={() => playTypingSound(soundKind)}
      title={title}
    >
      {children}
    </Link>
  );
}
