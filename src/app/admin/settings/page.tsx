import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/ui";
import { SettingsForms } from "./SettingsForms";
import { ChangePassword } from "./ChangePassword";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TECHNICAL") redirect("/deposit");

  const rival = await prisma.providerConfig.findUnique({ where: { id: "rival" } });
  const mt5 = await prisma.mt5Config.findUnique({ where: { id: "mt5" } });

  return (
    <>
      <TopBar user={session} />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <h1 className="text-xl font-semibold">Settings</h1>
        <ChangePassword email={session.email} />
        <SettingsForms
          rival={{
            baseUrl: rival?.baseUrl ?? "",
            createPaymentPath: rival?.createPaymentPath ?? "",
            statusPath: rival?.statusPath ?? "",
            healthPath: rival?.healthPath ?? "",
            enabled: rival?.enabled ?? false,
            hasKey: !!rival?.apiKey,
          }}
          mt5={{
            gatewayUrl: mt5?.gatewayUrl ?? "",
            defaultGroup: mt5?.defaultGroup ?? "",
            mt5Server: mt5?.mt5Server ?? "",
            mt5Login: mt5?.mt5Login ?? "",
            enabled: mt5?.enabled ?? false,
            hasKey: !!mt5?.gatewayKey,
            hasPassword: !!mt5?.mt5Password,
          }}
        />
      </main>
    </>
  );
}
