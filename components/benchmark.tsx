"use client";

import { useState, startTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Chat } from "./chat";
import { chatModels } from "../lib/ai/models";
import { generateUUID } from "../lib/utils";
import { toast } from "sonner";
import { savePromptIdAsCookie } from "../app/(chat)/actions";
import { PromptSelector } from "./prompt-selector";
import { MultimodalInput } from "./multimodal-input";
import { Attachment, Message, CreateMessage, ChatRequestOptions } from "ai";

interface BenchmarkProps {
  initialPromptId?: string;
}

export function Benchmark({ initialPromptId }: BenchmarkProps) {
  const router = useRouter();
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [chatInstances, setChatInstances] = useState<
    Array<{ id: string; modelId: string }>
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(
    initialPromptId || null
  );

  // Shared input state
  const [input, setInput] = useState<string>("");
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // References to chat instances
  const chatRefs = useRef<{ [key: string]: any }>({});

  // Handle prompt selection from any chat instance
  const handlePromptChange = (promptId: string) => {
    startTransition(() => {
      setSelectedPromptId(promptId);
      savePromptIdAsCookie(promptId);
    });
  };

  // Toggle model selection
  const toggleModelSelection = (modelId: string) => {
    startTransition(() => {
      setSelectedModels((prev) =>
        prev.includes(modelId)
          ? prev.filter((id) => id !== modelId)
          : [...prev, modelId]
      );
    });
  };

  // Start benchmark with selected models
  const startBenchmark = () => {
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    startTransition(() => {
      const newChatInstances = selectedModels.map((modelId) => ({
        id: generateUUID(),
        modelId,
      }));

      setChatInstances(newChatInstances);
      setIsDialogOpen(false);
    });
  };

  // Reset benchmark
  const resetBenchmark = () => {
    startTransition(() => {
      setChatInstances([]);
      setInput("");
      setAttachments([]);
      setMessages([]);
    });
  };

  // Handle shared input submission
  const handleSharedSubmit = async (
    event?: { preventDefault?: () => void } | undefined,
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (!input.trim() && attachments.length === 0) {
      return;
    }

    if (chatInstances.length === 0) {
      toast.error("Please select models first");
      return;
    }

    setIsLoading(true);

    // Create a message to send to all chats
    const message: CreateMessage = {
      role: "user",
      content: input,
    };

    // Add message to our local state
    const newUserMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    // Submit to all chat instances
    try {
      const promises = chatInstances.map((chat) => {
        if (chatRefs.current[chat.id] && chatRefs.current[chat.id].append) {
          return chatRefs.current[chat.id].append(message);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);

      // Clear input after successful submission
      setInput("");
      setAttachments([]);
    } catch (error) {
      toast.error("Failed to send message to all models");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop all chat generations
  const stopAllGenerations = () => {
    chatInstances.forEach((chat) => {
      if (chatRefs.current[chat.id] && chatRefs.current[chat.id].stop) {
        chatRefs.current[chat.id].stop();
      }
    });
    setIsLoading(false);
  };

  // Register chat instance methods
  const registerChatRef = (id: string, methods: any) => {
    chatRefs.current[id] = methods;
  };

  // Dummy append function for the shared input
  const dummyAppend = async () => {
    return null;
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center p-2 bg-background sticky top-0 z-10 border-b">
        <h2 className="text-lg font-semibold">AI Model Benchmark</h2>
        <div className="flex gap-2 items-center">
          {/* Shared prompt selector */}
          {chatInstances.length > 0 && (
            <PromptSelector
              userId={null}
              selectedPromptId={selectedPromptId}
              onPromptSelect={handlePromptChange}
              className="mr-2"
            />
          )}

          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            disabled={chatInstances.length > 0}
          >
            Select Models
          </Button>
          {chatInstances.length > 0 && (
            <Button variant="destructive" onClick={resetBenchmark}>
              Reset Benchmark
            </Button>
          )}
        </div>
      </div>

      {chatInstances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-4">
          <p className="text-muted-foreground">
            Select models to start benchmarking
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>Select Models</Button>
        </div>
      ) : (
        <>
          <div
            className={`grid gap-1 p-1 h-[calc(100vh-140px)] overflow-hidden`}
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                chatInstances.length,
                3
              )}, 1fr)`,
              gridTemplateRows:
                chatInstances.length > 3 ? "repeat(2, 1fr)" : "1fr",
            }}
          >
            {chatInstances.map((chat) => (
              <div
                key={chat.id}
                className="border rounded overflow-hidden h-full"
              >
                <Chat
                  id={chat.id}
                  initialMessages={[]}
                  selectedChatModel={chat.modelId}
                  isReadonly={false}
                  selectedPromptId={selectedPromptId}
                  onPromptChange={handlePromptChange}
                  isBenchmark={true}
                  hideInput={true}
                  onRegisterMethods={(methods) =>
                    registerChatRef(chat.id, methods)
                  }
                />
              </div>
            ))}
          </div>

          {/* Shared input for all chats */}
          <div className="p-4 border-t bg-background">
            <form
              onSubmit={handleSharedSubmit}
              className="flex mx-auto gap-2 w-full md:max-w-3xl"
            >
              <MultimodalInput
                chatId="shared"
                input={input}
                setInput={setInput}
                handleSubmit={handleSharedSubmit}
                isLoading={isLoading}
                stop={stopAllGenerations}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={[]}
                setMessages={() => {}}
                append={() => Promise.resolve(null)}
              />
            </form>
          </div>
        </>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => startTransition(() => setIsDialogOpen(open))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Models for Benchmark</DialogTitle>
            <DialogDescription>
              Choose the AI models you want to compare. All models will use the
              same prompt.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            {chatModels.map((model) => (
              <div key={model.id} className="flex items-center space-x-2">
                <Checkbox
                  id={model.id}
                  checked={selectedModels.includes(model.id)}
                  onCheckedChange={() => toggleModelSelection(model.id)}
                />
                <Label
                  htmlFor={model.id}
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleModelSelection(model.id)}
                >
                  <div>{model.name}</div>
                  {model.description && (
                    <div className="text-xs text-muted-foreground">
                      {model.description}
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => startTransition(() => setIsDialogOpen(false))}
            >
              Cancel
            </Button>
            <Button onClick={startBenchmark}>Start Benchmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
