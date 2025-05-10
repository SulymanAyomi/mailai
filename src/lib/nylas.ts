"use server"

import { auth } from "@/server/auth"
import Nylas, { Draft, Message, Thread } from "nylas"
import { CreateDraft } from "./types"
import { db } from "@/server/db"
import { thread } from "@/components/data"


const clientId = process.env.NYLAS_CLIENT_ID!
const callbackUri = "http://localhost:3000/api/nylas/callback"
const apiKey = process.env.NYLAS_API_KEY!
const apiUri = process.env.NYLAS_API_URI!

const nylas = new Nylas({
  apiKey: apiKey,
  apiUri: apiUri,
});






export const getNylasAuthUrl = async (serviceType: 'Google' | 'Office365') => {

  const session = await auth();
  if (!session) throw new Error('User not found')


  const authUrl = nylas.auth.urlForOAuth2({
    clientId: clientId,
    redirectUri: callbackUri,
    provider: 'google',
  });

  return authUrl

}

export const getNylasToken = async (code: string) => {
  try {

    const response = await nylas.auth.exchangeCodeForToken({
      clientSecret: apiKey,
      clientId: clientId, // Note this is *different* from your API key
      redirectUri: callbackUri, // URI you registered with Nylas in the previous step
      code,
    });
    console.log(response)
    const acct = await getinfo(response.grantId)


    return {
      grant: response.grantId,
      email: response.email,
      access_Token: response.accessToken,
      provider: response.provider,
      name: acct.name
    }



  } catch (error) {
    console.error('Unexpected error fetching Nylas grant:', error);
  }
}



export const getAllThreads = async (token: string) => {

  try {
    const getThread = async (grant: string, pageToken?: string) => {
      try {

        if (!pageToken) {
          const threads = await nylas.threads.list({
            identifier: grant,
            queryParams: {
              limit: 5,
            }
          })

          return threads
        } else {
          const threads = await nylas.threads.list({
            identifier: grant,
            queryParams: {
              limit: 5,
              pageToken
            }
          })

          return threads
        }

      } catch (error) {
        console.error('Error fetching thread:', error)
      }
    }

    let threads: Thread[] = []
    let pageToken: string | undefined = undefined
    let count = 0

    while (true) {
      let res = await getThread(token, pageToken)

      if (res?.data?.length === 0) break;
      res?.data.map((r) => threads.push(r))

      if (res?.nextCursor) { pageToken = res.nextCursor } else { break }
      if (count == 3) break
      count++

    }
    return threads

  } catch (error) {

    console.error('Error fetching threads:', error)
  }

}

export const deleteThread = async (grant: string, threadId: string) => {
  try {
    await nylas.threads.destroy({ identifier: grant, threadId })
    return {
      success: true
    }
    console.log(`Thread with ID ${threadId} deleted successfully.`)
  } catch (error) {
    console.error(`Error deleting thread with ID ${threadId}:`, error)
    return {
      success: false
    }
  }
}

export const getinfo = async (grantId: string) => {
  const account = await nylas.grants.find({ grantId });

  return account.data

}

export const getEmail = async (grantId: string, messageId: string) => {
  const email = await nylas.messages.find({
    identifier: grantId,
    messageId
  })

  return email.data

}

export const fetchDrafts = async (grantId: string) => {
  try {

    const getDraftMails = async (pageToken?: string) => {
      if (pageToken) {
        const Mails = await nylas.drafts.list({
          identifier: grantId,
          queryParams: {
            limit: 5,
            pageToken
          }
        })
        return Mails
      } else {
        const Mails = await nylas.drafts.list({
          identifier: grantId,
          queryParams: {
            limit: 5,
          }
        })
        return Mails

      }

    }

    let draft: Draft[] = []
    let pageToken = undefined
    let count = 0

    while (true) {
      const newData = await getDraftMails(pageToken)
      if (newData.data.length == 0) break
      newData.data.map((d) => draft.push(d))
      if (newData.nextCursor) { pageToken = newData.nextCursor } else { break }
      count++
      if (count == 3) break

    }
    return draft
  } catch (error) {
    console.error('Error fetching drafts:', error)
  }
}


export const createDraft = async (grantId: string, draft: CreateDraft, id: string) => {
  try {

    console.log("i actually ran")
    const createdDraft = await nylas.drafts.create({
      identifier: grantId,
      requestBody: draft
    })

    const data = createdDraft.data

    await db.draft.update({
      where: { id },
      data: {
        nylasDraftId: data.id,
        updatedAtRemote: new Date(data.date * 1000),
        syncUpdate: "synced",
        // updatedAt: new Date(data.date * 1000),
      }
    })

  } catch (error) {
    console.error('Error saving drafts:', error)
  }
}

export const deleteNylasDraft = async (grant: string, draftId: string) => {
  try {
    await nylas.drafts.destroy({ identifier: grant, draftId })
    console.log(`Draft with ID ${draftId} deleted successfully.`)
    return {
      success: true
    }
  } catch (error) {
    console.error(`Error deleting contact with ID ${draftId}:`, error)
    return {
      success: false
    }
  }
}

export const sendNylasDraft = async (grant: string, draftId: string) => {
  try {
    await nylas.drafts.send({ identifier: grant, draftId })
    console.log(`Draft with ID ${draftId} sent successfully.`)
    return {
      success: true
    }
  } catch (error) {
    console.error(`Error sending contact with ID ${draftId}:`, error)
    return {
      success: false
    }
  }
}

export const updateNylasDraft = async (grant: string, draftId: string, draft: CreateDraft) => {
  try {
    const updatedDraft = await nylas.drafts.update({
      identifier: grant, draftId, requestBody: {
        ...draft
      }
    })

    console.log(`Draft with ID ${draftId} updated successfully.`)
    if (updatedDraft) {
      const data = updatedDraft.data
      await db.draft.update({
        where: { id: draftId },
        data: {
          updatedAtRemote: new Date(data.date * 1000),
          syncUpdate: "synced",
        }
      })
      return {
        success: true,
      }
    }
    return {
      success: false
    }

  } catch (error) {
    console.error(`Error updating contact with ID ${draftId}:`, error)
    return {
      success: false,
    }

  }
}



export const fetchSentMail = async (grant: string) => {
  try {

    const getSentMails = async (pageToken?: string) => {
      if (pageToken) {
        const sentMails = await nylas.threads.list({
          identifier: grant,
          queryParams: {
            in: ["SENT"],
            limit: 5,
            pageToken
          }
        })
        return sentMails
      } else {
        const sentMails = await nylas.threads.list({
          identifier: grant,
          queryParams: {
            in: ["SENT"],
            limit: 5,
          }
        })
        return sentMails

      }

    }

    let threads: Thread[] = []
    let pageToken = undefined
    let count = 0
    while (true) {
      const sentMails = await getSentMails(pageToken)

      if (sentMails.data.length == 0) break;
      sentMails.data.map((d) => threads.push(d))

      if (sentMails.nextCursor) pageToken = sentMails.nextCursor
      if (count == 3) break
      count++

    }
    return threads
  } catch (error) {
    console.log("error fetching sent mail", error)
  }


}