'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';

import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';

// Add these props to the Chat component
export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  isReadonly,
  selectedPromptId,
  onPromptChange,
  isBenchmark = false,
  hideInput = false,
  onRegisterMethods
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  isReadonly: boolean;
  selectedPromptId?: string | null;
  onPromptChange?: (promptId: string) => void;
  isBenchmark?: boolean;
  hideInput?: boolean;
  onRegisterMethods?: (methods: { append: any, stop: any }) => void;
}) {
  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    initialMessages,
    body: {
      chatId: id,
      selectedChatModel,
      selectedPromptId,
    },
    onResponse: (response) => {
      if (response.status === 401) {
        toast.error(
          'You need to be logged in to chat. Please sign in and try again.'
        );
      }
    },
  });

  // Register methods for parent component to use
  useEffect(() => {
    if (onRegisterMethods) {
      onRegisterMethods({
        append,
        stop
      });
    }
  }, [append, stop, onRegisterMethods]);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  return (
    <>
      <div className={`flex flex-col min-w-0 ${isBenchmark ? 'h-full' : 'h-dvh'} bg-background`}>
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          isReadonly={isReadonly}
          userId={null}
          selectedPromptId={selectedPromptId ?? null}
          onPromptChange={onPromptChange}
          isBenchmark={isBenchmark}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        {!hideInput && !isReadonly && (
          <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          </form>
        )}
      </div>

      {!isBenchmark && (
        <Artifact
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          append={append}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          votes={votes}
          isReadonly={isReadonly}
        />
      )}
    </>
  );
}
