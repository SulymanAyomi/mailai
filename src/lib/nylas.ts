"use server"

import { auth } from "@/server/auth"
import Nylas from "nylas"

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
    return {
      grant: response.grantId,
      email: response.email,
      access_Token: response.accessToken,
      provider: response.provider
    }



  } catch (error) {
    console.error('Unexpected error fetching Nylas grant:', error);
  }
}
