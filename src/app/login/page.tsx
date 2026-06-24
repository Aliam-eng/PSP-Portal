import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "TECHNICAL" ? "/admin/transactions" : "/deposit");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Staff sign in</h1>
        <p className="mb-4 text-sm text-slate-500">PSP Portal — admin dashboards</p>
        <LoginForm />
      </div>
    </div>
  );
}
