"use server";

import { getAllModels } from "../../lib/db/queries";
import { Models } from "../../lib/db/schema";
import {
  getUserModels as fetchUserModels,
  upsertUserModelApiKey as upsertApiKey,
  deleteUserModel as removeUserModel,
} from "../../lib/db/queries";
import { UserModels } from "../../lib/db/schema";
import { auth } from "../(auth)/auth";

export async function getModels(): Promise<Models[]> {
  try {
    const models = await getAllModels();
    return models;
  } catch (error) {
    console.error("Failed to get models", error);
    throw error;
  }
}

export async function getUserModels(): Promise<UserModels[]> {
  try {
    console.log("Fetching user models...");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      console.error("User is not authenticated");
      return [];
    }
    const userModels = await fetchUserModels({ userId });
    console.log("User models fetched:", userModels);
    return userModels;
  } catch (error) {
    console.error("Failed to get user models", error);
    throw error;
  }
}

export async function upsertUserModelApiKey(
  modelId: string,
  apiKey: string
): Promise<void> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      console.error("User is not authenticated");
      return;
    }
    const result = await upsertApiKey({ userId, modelId, apiKey });
    console.log("API key updated successfully", result);
  } catch (error) {
    console.error("Failed to update user model API key", error);
    throw error;
  }
}

export async function deleteUserModel(modelId: string): Promise<void> {
  try {
    console.log(`Deleting user model ${modelId}...`);
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      console.error("User is not authenticated");
      return;
    }
    await removeUserModel({ userId, modelId });
    console.log(`User model ${modelId} deleted successfully.`);
  } catch (error) {
    console.error("Failed to delete user model", error);
    throw error;
  }
}
