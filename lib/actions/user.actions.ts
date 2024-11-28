"use server";
// **Create account flow**
// 1. User enters full name and email
// 2. Check if a user already exists using email.
// 3. Send OTP to user's email.
// 4. This will send a secret key for creating a session
// 5. Create a new user's document if the user is a new user.
// 6. Return the user's accountId that will be used to complete the login.
// 7. Verify OTP and authenticate to login.

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "@/lib/utils";

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])],
  );

  return result.total > 0 ? result.documents[0] : null;
};

const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP({ email });
  if (!accountId) {
    throw new Error("Failed to send email OTP");
  }
  if (!existingUser) {
    const { databases } = await createAdminClient();
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar:
          "https://media.istockphoto.com/id/1435566677/vector/placeholder-icon-illustration.jpg?s=612x612&w=0&k=20&c=mMfFWN3fGUOv5S75bC5tmMSzFDNoqiCQFfVoMTsC4n0=",
        accountId,
      },
    );
  }
  return parseStringify({ accountId });
};
