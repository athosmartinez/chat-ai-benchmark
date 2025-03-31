import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "../../../(auth)/auth";
import { Chat } from "../../../../components/chat";
import { getChatById, getMessagesByChatId, getChatsByBenchmarkId } from "../../../../lib/db/queries";
import { convertToUIMessages } from "../../../../lib/utils";
import { DataStreamHandler } from "../../../../components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "../../../../lib/ai/models";
import type { Message } from "../../../../lib/db/schema";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import { getModels } from "../../../(models)/actions";

export default async function BenchmarkHistoryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id: benchmarkId } = params;

  const chats = await getChatsByBenchmarkId({ benchmarkId });

  if (!chats || chats.length === 0) {
    notFound();
  }

  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  const firstChat = await getChatById({ id: chats[0].id });
  if (!firstChat || session.user.id !== firstChat.userId) {
    return notFound();
  }

  const models = await getModels();

  const allMessages: Message[] = [];
  for (const chat of chats) {
    const messagesFromDb = await getMessagesByChatId({ id: chat.id });
    allMessages.push(...messagesFromDb);
  }

  const cookieStore = await cookies();
  const promptIdFromCookie = cookieStore.get("prompt-id");

  return (
    <div className="flex flex-col p-4 h-full">
      <div className="text-white font-bold mb-4">
        Nome do chat: {firstChat.title}
      </div>

      {chats.length === 1 ? (
        <div className="flex-1 border p-4 rounded-lg bg-gray-800 h-full">
          {(() => {
            const chat = chats[0];
            const chatModel = models.find((model) => model.id === chat.modelId);
            const displayModelName = chatModel?.officialName || DEFAULT_CHAT_MODEL;

            return (
              <>
                <h2 className="text-lg font-semibold text-white mb-2">
                  {displayModelName}
                </h2>
                <ErrorBoundary>
                  <div className="h-[calc(100%-2rem)]">
                    <Chat
                      id={chat.id}
                      initialMessages={convertToUIMessages(
                        allMessages.filter((msg) => msg.chatId === chat.id) as any
                      )}
                      selectedPromptId={promptIdFromCookie?.value}
                      selectedChatModel={displayModelName}
                      isReadonly={true}
                    />
                  </div>
                </ErrorBoundary>
              </>
            );
          })()}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {chats.map((chat) => {
            const chatModel = models.find((model) => model.id === chat.modelId);
            const displayModelName = chatModel?.officialName || DEFAULT_CHAT_MODEL;

            return (
              <div key={chat.id} className="border p-4 rounded-lg bg-gray-800">
                <h2 className="text-lg font-semibold text-white">
                  {displayModelName}
                </h2>
                <ErrorBoundary>
                  <Chat
                    id={chat.id}
                    initialMessages={convertToUIMessages(
                      allMessages.filter((msg) => msg.chatId === chat.id) as any
                    )}
                    selectedPromptId={promptIdFromCookie?.value}
                    selectedChatModel={displayModelName}
                    isReadonly={true}
                  />
                </ErrorBoundary>
              </div>
            );
          })}
        </div>
      )}
      <DataStreamHandler id={benchmarkId} />
    </div>
  );
}