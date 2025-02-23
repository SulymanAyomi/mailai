import 'server-only'
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { google } from "googleapis";
import { console } from "inspector";



export const linkMail = async (serviceType: 'Gmail' | 'Outlook') => {
    const session = await auth();
    if (!session) throw new Error('User not found')
    const user = await db.account.findFirst({
        where: {
            id: session.user.id
        },
        select: {
            provider: true,
            access_token: true
        }
    })
    console.log(user)

    const gmailAuth = new google.auth.OAuth2();
    gmailAuth.setCredentials({ access_token: user?.access_token });

    const gmail = google.gmail({ version: "v1", auth: gmailAuth });



    try {
        const messages = await gmail.users.messages.list({ userId: "me", maxResults: 5 });

        if (!messages.data.messages) {
            console.log("No messages");
            return;
        }


        const emailDetails = await Promise.all(
            messages.data.messages.map(async (message) => {
                const msg = gmail.users.messages.get({ userId: "me", id: message?.id });
                console.log(msg)
                // {
                //       id: msg.data.id,
                //       snippet: msg.data.snippet,
                //       from: msg.data.payload?.headers?.find((h) => h.name === "From")?.value || "Unknown",
                //       subject: msg.data.payload?.headers?.find((h) => h.name === "Subject")?.value || "No Subject",
                //     };
            })
        );
        // console.log("email", emailDetails);



        // res.json({ emails: emailDetails });
    } catch (error) {
        console.error("Error fetching emails:", error);
        // res.status(500).json({ error: "Failed to fetch emails" });
    }
}