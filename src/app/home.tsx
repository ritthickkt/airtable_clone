import Link from "next/link";
import Image from "next/image";

import { LatestPost } from "ritthickclone/app/_components/post";
import { auth } from "ritthickclone/server/auth";
import { api, HydrateClient } from "ritthickclone/trpc/server";
import logo from "../assets/airtable.svg"
import '../../styles/landingpage.css'

export default async function HomePage() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <div className="landing-page-header">
          Welcome to the homepage, {session?.user?.name}!
      </div>
    </HydrateClient>
  );
}