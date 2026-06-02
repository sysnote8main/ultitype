"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "../../_components/AppShell";
import { InputScreenSettingsScreen } from "../../_components/InputScreenSettingsScreen";

export default function SettingsScreenPage() {
  const router = useRouter();

  return (
    <AppShell>
      {(session) => (
        <InputScreenSettingsScreen
          onBack={() => router.push("/settings")}
          onChange={session.updateSettings}
          settings={session.settings}
        />
      )}
    </AppShell>
  );
}
