import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { and, asc, desc, eq, gt, gte, inArray, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  user,
  chat,
  prompts,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  benchmark,
  models,
} from "./schema";
import { ArtifactKind } from "@/components/artifact";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
  promptId,
  benchmarkId,
  modelId,
}: {
  id: string;
  userId: string;
  title: string;
  promptId?: string | null;
  benchmarkId?: string | null;
  modelId?: string | null;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      promptId: promptId || null,
      benchmarkId: benchmarkId || null,
      modelId: modelId || null,
    });
  } catch (error) {
    console.error("Failed to save chat in database", error);
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error("Failed to save messages in database");
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error("Failed to get messages by chat id from database");
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (error) {
    console.error("Failed to upvote message in database", error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error("Failed to get votes by chat id from database");
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save document in database");
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error("Failed to get document by id from database");
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error("Failed to get document by id from database");
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      "Failed to delete documents by id after timestamp from database"
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error("Failed to save suggestions in database");
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      "Failed to get suggestions by document version from database"
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error("Failed to get message by id from database");
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (error) {
    console.error(
      "Failed to delete messages by id after timestamp from database"
    );
    throw error;
  }
}

export async function savePrompt({
  userId,
  prompt,
  name,
  createdAt = new Date(), // Setting default value for backward compatibility
}: {
  userId: string;
  prompt: string;
  name: string;
  createdAt?: Date;
}) {
  try {
    return await db
      .insert(prompts)
      .values({ userId, prompt, name, createdAt: createdAt || new Date() });
  } catch (error) {
    console.error("Failed to save prompt in database");
    throw error;
  }
}

export async function deletePromptById({ id }: { id: string }) {
  try {
    return await db.delete(prompts).where(eq(prompts.id, id));
  } catch (error) {
    console.error("Failed to delete prompt by id from database");
    throw error;
  }
}

export async function getPrompts({ userId }: { userId: string }) {
  try {
    return await db.select().from(prompts).where(eq(prompts.userId, userId));
  } catch (error) {
    console.error("Failed to get prompts from database");
    throw error;
  }
}

export async function getPromptById({ id }: { id: string }) {
  try {
    const [selectedPrompt] = await db
      .select()
      .from(prompts)
      .where(eq(prompts.id, id));
    return selectedPrompt || null;
  } catch (error) {
    console.error("Failed to get prompt by id from database");
    throw error;
  }
}

export async function updatePrompt({
  id,
  name,
  prompt,
}: {
  id: string;
  name?: string;
  prompt?: string;
}) {
  try {
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (prompt !== undefined) updateData.prompt = prompt;

    if (Object.keys(updateData).length === 0) return null;

    await db.update(prompts).set(updateData).where(eq(prompts.id, id));

    return getPromptById({ id });
  } catch (error) {
    console.error("Failed to update prompt in database");
    throw error;
  }
}

export async function saveBenchmark({ id }: { id: string }) {
  try {
    return await db.insert(benchmark).values({ id, createdAt: new Date() });
  } catch (error) {
    console.error("Failed to save benchmark in database");
    throw error;
  }
}

export async function getBenchmarkById({ id }: { id: string }) {
  try {
    const [selectedBenchmark] = await db
      .select()
      .from(benchmark)
      .where(eq(benchmark.id, id));
    return selectedBenchmark || null;
  } catch (error) {
    console.error("Failed to get benchmark by id from database");
    throw error;
  }
}

export async function getBenchmarksByUserId({ userId }: { userId: string }) {
  try {
    const benchmarkChats = await db
      .select({
        id: chat.id,
        createdAt: chat.createdAt,
        title: chat.title,
        benchmarkId: chat.benchmarkId,
      })
      .from(chat)
      .where(and(eq(chat.userId, userId), isNotNull(chat.benchmarkId)))
      .orderBy(desc(chat.createdAt));

    // Rest of your function remains the same
    const benchmarks = benchmarkChats.reduce((acc, chat) => {
      if (!chat.benchmarkId) return acc;

      if (!acc[chat.benchmarkId]) {
        acc[chat.benchmarkId] = {
          id: chat.benchmarkId,
          title: `Benchmark ${new Date(chat.createdAt).toLocaleString()}`,
          createdAt: chat.createdAt,
          chats: [],
        };
      }

      acc[chat.benchmarkId].chats.push(chat);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(benchmarks).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Failed to get benchmarks by user ID from database");
    throw error;
  }
}

export async function getAllModels() {
  try {
    return await db.select().from(models);
  } catch (error) {
    console.error("Failed to get models from database");
    throw error;
  }
}

export async function getModelById({ id }: { id: string }) {
  try {
    const result = await db
      .select()
      .from(models)
      .where(eq(models.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Failed to get model by ID", error);
    throw error;
  }
}

export async function getChatsByBenchmarkId({ benchmarkId }: { benchmarkId: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.benchmarkId, benchmarkId))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by benchmark ID from database", error);
    throw error;
  }
}
export async function getAllVotes() {
  try {
    return await db
      .select({
        modelId: chat.modelId,
        chatId: vote.chatId,
        messageId: vote.messageId,
        isUpvoted: vote.isUpvoted,
      })
      .from(vote)
      .innerJoin(chat, eq(vote.chatId, chat.id));
  } catch (error) {
    console.error("Failed to get all votes", error);
    throw error;
  }
}

