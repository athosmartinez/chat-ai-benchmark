"use server";

import { getAllModels } from "../../lib/db/queries";
import { Models } from "../../lib/db/schema";

export async function getModels(): Promise<Models[]> {
  try {
    const models = await getAllModels();

    return models;
  } catch (error) {
    console.error("Failed to get models", error);
    throw error;
  }
}
