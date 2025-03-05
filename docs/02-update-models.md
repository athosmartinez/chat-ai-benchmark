# Update Models

The chatbot template ships with [OpenAI](https://sdk.vercel.ai/providers/ai-sdk-providers/openai) as the default model provider. Since the template is powered by the [AI SDK](https://sdk.vercel.ai), which supports [multiple providers](https://sdk.vercel.ai/providers/ai-sdk-providers) out of the box, you can easily switch to another provider of your choice.

To update the models, you will need to update the custom provider called `myProvider` at `/lib/ai/models.ts` shown below.

```ts
import { customProvider } from "ai";
import { openai } from "@ai-sdk/openai";

export const myProvider = customProvider({
  languageModels: {
    "chat-model-openai-mini": openai("gpt-4o-mini"),
    "chat-model-openai-default": openai("gpt-4o"),
    "chat-model-reasoning": wrapLanguageModel({
      model: fireworks("accounts/fireworks/models/deepseek-r1"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": openai("gpt-4-turbo"),
    "artifact-model": openai("gpt-4o-mini"),
  },
  imageModels: {
    "small-model": openai.image("dall-e-3"),
  },
});
```

You can find the provider library and model names in the [provider](https://sdk.vercel.ai/providers/ai-sdk-providers)'s documentation. Once you have updated the models, you should be able to use the new models in your chatbot.
