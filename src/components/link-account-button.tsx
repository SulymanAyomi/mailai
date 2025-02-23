import { getAurinkoAuthUrl } from "@/lib/aurinko";
import { api } from "@/trpc/react";
import axios from "axios";
import { Signin } from "./sig";
import { getNylasAuthUrl } from "@/lib/nylas";

export const LinkAccountButton = () => {
  const fetchEmails = async () => {
    try {
      const url = await getNylasAuthUrl("Google");
      window.location.href = url;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <button
      onClick={() => fetchEmails()}
      className="rounded bg-blue-500 p-2 text-white"
    >
      Link Account
    </button>
  );
};
