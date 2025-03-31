import { cookies } from "next/headers";
import { AppSidebar } from "../../components/app-sidebar";
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar";
import { auth } from "../(auth)/auth";
import Script from "next/script";
import { ProviderInitializer } from "../../components/provider-initializer";

export default async function BenchmarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {/* Pyodide Script para suporte a execução de código Python */}
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <ProviderInitializer />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session.user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
