# Create T3 App

<!-- bun install dompurify and @types/dompurify
bun install date-fns
bun install react-letter
bun install avatar framer-motion -->

model UserAccount {
id String @id @default(cuid())
userId String

    binaryIndex Json?

    token        String @unique
    provider     String
    emailAddress String
    name         String
    threads        Thread[]
    emailAddresses EmailAddress[]

}

model Thread {
id String @id @default(cuid())
subject String
lastMessageDate DateTime
participantIds String[]
userAccountId String
userAccount UserAccount @relation(fields: [userAccountId], references: [id])

    done Boolean @default(false)

    inboxStatus Boolean @default(true)
    draftStatus Boolean @default(false)
    sentStatus  Boolean @default(false)

    emails Email[]

}

model Email {
id String @id @default(cuid())
threadId String
thread Thread @relation(fields: [threadId], references: [id])
createdTime DateTime
lastModifiedTime DateTime
sentAt DateTime
receivedAt DateTime
internetMessageId String
subject String
sysLabels String[]
keywords String[]
sysClassifications String[]
sensitivity Sensitivity @default(normal)
meetingMessageMethod MeetingMessageMethod?
from EmailAddress @relation("FromEmail", fields: [fromId], references: [id])
fromId String
to EmailAddress[] @relation("ToEmails")
cc EmailAddress[] @relation("CcEmails")
bcc EmailAddress[] @relation("BccEmails")
replyTo EmailAddress[] @relation("ReplyToEmails")
hasAttachments Boolean
body String?
bodySnippet String?
attachments EmailAttachment[]
inReplyTo String?
references String?
threadIndex String?
internetHeaders Json[]
nativeProperties Json?
folderId String?
omitted String[]

    emailLabel EmailLabel @default(inbox)

}

model EmailAddress {
id String @id @default(cuid())
name String?
address String
raw String?
sentEmails Email[] @relation("FromEmail")
receivedTo Email[] @relation("ToEmails")
receivedCc Email[] @relation("CcEmails")
receivedBcc Email[] @relation("BccEmails")
replyToEmails Email[] @relation("ReplyToEmails")

    UserAccount   UserAccount? @relation(fields: [userAccountId], references: [id])
    userAccountId String?

}

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
