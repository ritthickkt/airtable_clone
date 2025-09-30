import { auth } from "ritthickclone/server/auth";
import { api, HydrateClient } from "ritthickclone/trpc/server";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <HomePageClient session={session}/>
    </HydrateClient>
  );
}