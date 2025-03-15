import "server-only";

import {
  savePrompt,
  deletePromptById,
  getPrompts,
  getPromptById,
  updatePrompt
} from "../../../../lib/db/queries";

export type Prompt = {
  id: string;
  name: string;
  prompt: string;
  userId: string;
  createdAt: Date;
};

export async function createPrompt({
  userId,
  name,
  prompt
}: {
  userId: string;
  name: string;
  prompt: string;
}) {
  return await savePrompt({ userId, name, prompt, createdAt: new Date() });
}

export async function getUserPrompts(userId: string) {
  return await getPrompts({ userId });
}

export async function getPrompt(id: string) {
  return await getPromptById({ id });
}

export async function modifyPrompt({
  id,
  name,
  prompt
}: {
  id: string;
  name?: string;
  prompt?: string;
}) {
  return await updatePrompt({ id, name, prompt });
}

export async function removePrompt(id: string) {
  return await deletePromptById({ id });
}
