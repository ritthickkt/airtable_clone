import { auth } from "../../server/auth";
import { api, HydrateClient } from "ritthickclone/trpc/server";
import { notFound } from "next/navigation";
import BaseDashboardClient from "./BaseDashboardClient";

interface PageProps {
  params: Promise<{
    baseId: string;
  }>;
}

export default async function BasePage({ params }: PageProps) {
  const session = await auth();
  
  if (!session?.user) {
    return <div>Please log in</div>;
  }

  const { baseId } = await params;
  const base = await api.base.getById({ id: baseId });
  
  if (!base) {
    notFound();
  }

  return (
    <HydrateClient>
      <BaseDashboardClient session={session} base={base} />
    </HydrateClient>
  );
}