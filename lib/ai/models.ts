import { openai } from "@ai-sdk/openai";
import { deepseek } from "@ai-sdk/deepseek";
import { xai } from "@ai-sdk/xai";
import { google } from "@ai-sdk/google";
import { perplexity } from "@ai-sdk/perplexity";
import { fireworks } from "@ai-sdk/fireworks";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

export const DEFAULT_CHAT_MODEL: string = "chat-model-openai-default";

// Map provider names to their respective model-creating functions
const providerMap = {
  openai: openai,
  deepseek: deepseek,
  xai: xai,
  google: google,
  perplexity: perplexity,
  fireworks: fireworks,
};

// This function creates a provider with dynamically configured models
export function createDynamicProvider(modelConfigs) {
  const languageModels = {};

  modelConfigs.forEach((model) => {
    const provider = providerMap[model.provider?.toLowerCase()];
    if (provider) {
      languageModels[model.id] = provider(model.officialName);
    }
  });

  // Always include title and artifact models
  languageModels["title-model"] = openai("gpt-4o-mini");
  languageModels["artifact-model"] = openai("gpt-4o-mini");

  return customProvider({
    languageModels,
    imageModels: {},
  });
}

// Default provider with basic models for initial loading
export const myProvider = customProvider({
  languageModels: {
    "chat-model-openai-mini": openai("gpt-4o-mini"),
    "chat-model-openai-default": openai("gpt-4o"),
    "title-model": openai("gpt-4o-mini"),
    "artifact-model": openai("gpt-4o-mini"),
  },
  imageModels: {},
});

interface ChatModel {
  id: string;
  officialName: string;
}

// until not regiser keys per user
export const suportedModels: Array<ChatModel> = [
  {
    id: "0bef68af-800b-4209-b3c2-c2dd43d54833",
    officialName: "gpt-4o-mini",
  },
  {
    id: "79e2d9a0-5e24-42d2-a7fb-36c825e1476d",
    officialName: "gpt-4o",
  },
  {
    id: "7891ba99-6e09-4593-80d2-63b7b8add618",
    officialName: "gemini-2.0-flash",
  },
  {
    id: "38aa7b15-e208-44d6-93ea-c3ba936909e9",
    officialName: "grok-2-1212",
  },
  {
    id: "f2fd53f2-33a7-45f3-a6fa-f08b479383f5",
    officialName: "deepseek-chat",
  },
];
