import { openai } from "@ai-sdk/openai";
import { deepseek } from "@ai-sdk/deepseek";
import { xai } from "@ai-sdk/xai";
import { google } from "@ai-sdk/google";
import { fireworks } from "@ai-sdk/fireworks";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

export const DEFAULT_CHAT_MODEL: string = "chat-model-openai-default";

// Define provider type to avoid implicit any errors
type ProviderFunction =
  | typeof openai
  | typeof deepseek
  | typeof xai
  | typeof google
  | typeof fireworks

// Define model interface
export interface ModelConfig {
  id: string;
  officialName: string;
  provider: string;
  inputPriceMillionToken?: string | null;
  outputPriceMillionToken?: string | null;
}

// Map provider names to their respective model-creating functions
const providerMap: Record<string, ProviderFunction> = {
  openai: openai,
  deepseek: deepseek,
  xai: xai,
  google: google,
  fireworks: fireworks,
};

// This function creates a provider with dynamically configured models
export function createDynamicProvider(modelConfigs: ModelConfig[]) {
  const languageModels: Record<string, ReturnType<ProviderFunction>> = {};

  modelConfigs.forEach((model) => {
    const providerKey = model.provider?.toLowerCase();
    const provider = providerKey ? providerMap[providerKey] : undefined;
    if (provider && model.officialName) {
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

export interface ChatModel {
  id: string;
  officialName: string;
}

// until not regiser keys per user
export const suportedModels: Array<ChatModel> = [
  { id: "0bef68af-800b-4209-b3c2-c2dd43d54833", officialName: "gpt-4o-mini" },
  { id: "15bb27df-35b4-42e4-ad2f-9f84c4e5eb48", officialName: "gpt-4-turbo" },
  { id: "3619b2b2-5bcf-47c4-b841-0c3fd32c3f4b", officialName: "gemini-1.5-pro-latest" },
  { id: "5cf21dd2-7454-4ea1-b36d-71a3ffc39c8d", officialName: "gemini-2.5-pro-exp-03-25" },
  { id: "7891ba99-6e09-4593-80d2-63b7b8add618", officialName: "gemini-2.0-flash" },
  { id: "79e2d9a0-5e24-42d2-a7fb-36c825e1476d", officialName: "gpt-4o" },
  { id: "7ab92961-efb0-4ed7-94d1-1e3eb8f45cf2", officialName: "gpt-3.5-turbo" },
  { id: "c6650344-7e27-46fc-8aad-1fb55ae8ffcc", officialName: "gpt-4.1" },
  { id: "f2fd53f2-33a7-45f3-a6fa-f08b479383f5", officialName: "deepseek-chat" },
  { id: "f43172c5-b9e7-4055-9cd9-ac7b71ce4a95", officialName: "deepseek-reasoner"}
];
