import Link from "next/link";
import Image from "next/image";

import { LatestPost } from "ritthickclone/app/_components/post";
import { auth } from "ritthickclone/server/auth";
import { api, HydrateClient } from "ritthickclone/trpc/server";
import logo from "./assets/airtable.svg"
import '../styles/landingpage.css'

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <div className="landing-page-header">
          <div className="logo-name">
            <Image src={logo} alt="Airtable Logo" width={40} height={40} />
            Airtable
          </div>
          <button className="button">
            Platform 
          </button>
          <button className="button">
            Solutions 
          </button>
          <button className="button">
            Resources
          </button>
          <button className="button">
            Enterprise
          </button>
          <button className="button">
            Pricing
          </button>
          <div className="lefthandside-buttons">
            <button className="bookademo-button">
              Book a Demo
            </button>
            <button className="signup-button">
              Sign Up For Free
            </button>
            <Link className="login-button" href="/api/auth/signin">
              Log in
            </Link>
          </div>
      </div>
    </HydrateClient>
  );
}
