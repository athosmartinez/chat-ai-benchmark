import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai";

import { auth } from "@/app/(auth)/auth";
import { myProvider, createDynamicProvider } from "@/lib/ai/models";
import {
  deleteChatById,
  getChatById,
  getPromptById,
  saveChat,
  saveMessages,
  getModelById,
} from "@/lib/db/queries";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";

import { generateTitleFromUserMessage } from "../../actions";
import { createDocument } from "@/lib/ai/tools/create-document";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { getWeather } from "@/lib/ai/tools/get-weather";

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel,
    selectedPromptId,
    benchmarkId,
  }: {
    id: string;
    messages: Array<Message>;
    selectedChatModel: string;
    selectedPromptId: string;
    benchmarkId: string;
  } = await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  // Get model information from the database
  const modelInfo = await getModelById({ id: selectedChatModel });

  if (!modelInfo || !modelInfo.officialName || !modelInfo.provider) {
    return new Response("Invalid model selection", { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({
      id,
      userId: session.user.id,
      title,
      promptId: selectedPromptId,
      benchmarkId,
      modelId: selectedChatModel,
    });
  }

  // Save user message with time: 0
  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id, time: 0 }],
  });

  // Record the start time for the assistant response
  const responseStartTime = Date.now();

  let prompt = null;

  if (selectedPromptId) {
    const { prompt: fetchedPrompt } = await getPromptById({
      id: selectedPromptId,
    });
    prompt = fetchedPrompt;
  }

  if (!prompt) {
    return new Response("Create an prompt to use it!", { status: 400 });
  }

  const dynamicProvider = createDynamicProvider([modelInfo]);

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: dynamicProvider.languageModel(selectedChatModel),
        system: prompt,
        messages,
        maxSteps: 5,
        experimental_transform: smoothStream({ chunking: "word" }),
        experimental_generateMessageId: generateUUID,
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              // Calculate elapsed time
              const responseEndTime = Date.now();
              const elapsedTime = responseEndTime - responseStartTime; // in ms

              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                    time: elapsedTime, // Save the elapsed time
                  };
                }),
              });
            } catch (error) {
              console.error("Failed to save chat");
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: () => {
      return "Oops, an error occured!";
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
