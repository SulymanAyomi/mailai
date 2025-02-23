"use server"

import { signIn } from "@/server/auth";

export const Signin = async () => {
    await signIn("google", {
        redirectTo: "http://localhost:3000/api/gmail/callback",
    });
}



