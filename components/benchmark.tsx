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
import { generateUUID } from "../lib/utils";
import { toast } from "sonner";
import { savePromptIdAsCookie, saveBenchmark } from "../app/(chat)/actions";
import { PromptSelector } from "./prompt-selector";
import { MultimodalInput } from "./multimodal-input";
import { Attachment, Message, CreateMessage, ChatRequestOptions } from "ai";
import { SidebarToggle } from "./sidebar-toggle";
import { Models } from "@/lib/db/schema";
import {
  getModels,
  getUserModels,
  upsertUserModelApiKey,
  deleteUserModel,
} from "@/app/(models)/actions";
import { auth } from "@/app/(auth)/auth";

interface BenchmarkProps {
  initialPromptId?: string | null;
}

export function Benchmark({ initialPromptId }: BenchmarkProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [chatInstances, setChatInstances] = useState<
    Array<{ id: string; modelId: string; benchmarkId?: string }>
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(
    initialPromptId || null
  );
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [currentBenchmarkId, setCurrentBenchmarkId] = useState<string | null>(
    null
  );
  const [models, setModels] = useState<Models[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);

  // Shared input state
  const [input, setInput] = useState<string>("");
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // References to chat instances
  const chatRefs = useRef<{ [key: string]: any }>({});
  // Reference for chat containers to sync scrolling
  const chatContainersRef = useRef<HTMLDivElement>(null);

  // Add state for API keys
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Fetch models from database
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const dbModels = await getModels();
        setModels(dbModels);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        toast.error("Failed to load models");
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  // Fetch user models and their API keys
  useEffect(() => {
    const fetchUserModels = async () => {
      try {
        const userModels = await getUserModels();
        const keys = userModels.reduce((acc: Record<string, string>, model) => {
          acc[model.modelId] = model.apiKey || "";
          return acc;
        }, {});
        setApiKeys(keys);
      } catch (error) {
        console.error("Failed to fetch user models:", error);
        toast.error("Failed to load user models");
      }
    };

    fetchUserModels();
  }, []);

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
  const startBenchmark = async () => {
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    startTransition(async () => {
      try {
        // Generate a benchmark ID
        const benchmarkId = generateUUID();
        setCurrentBenchmarkId(benchmarkId);

        // Save benchmark to database
        await saveBenchmark({ id: benchmarkId });

        // Check if we already have chat instances and messages
        if (chatInstances.length > 0 && messages.length > 0) {
          // Create a new benchmark by resetting everything first
          setChatInstances([]);
          setInput("");
          setAttachments([]);
          setMessages([]);

          // Then add the new chat instances after a short delay to ensure state is updated
          setTimeout(() => {
            const newChatInstances = selectedModels.map((modelId) => ({
              id: generateUUID(),
              modelId,
              benchmarkId,
            }));
            setChatInstances(newChatInstances);
          }, 100);
        } else {
          const newChatInstances = selectedModels.map((modelId) => ({
            id: generateUUID(),
            modelId,
            benchmarkId,
          }));
          setChatInstances(newChatInstances);
        }

        setIsDialogOpen(false);
      } catch (error) {
        console.error("Failed to create benchmark:", error);
        toast.error("Failed to create benchmark");
      }
    });
  };

  // Reset benchmark
  const resetBenchmark = () => {
    startTransition(() => {
      setChatInstances([]);
      setInput("");
      setAttachments([]);
      setMessages([]);
      setCurrentBenchmarkId(null);
      setIsResetDialogOpen(false);
    });
  };

  // Handle shared input submission
  const handleSharedSubmit = async (
    event?: { preventDefault?: () => void } | undefined
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

  // Sync scrolling between chat instances
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!chatContainersRef.current) return;

    const scrolledContainer = e.currentTarget;
    const scrollTop = scrolledContainer.scrollTop;

    // Get all chat containers
    const chatContainers =
      chatContainersRef.current.querySelectorAll(".chat-container");

    // Sync scroll position for all containers except the one being scrolled
    chatContainers.forEach((container) => {
      if (container !== scrolledContainer && container instanceof HTMLElement) {
        container.scrollTop = scrollTop;
      }
    });
  };

  // Dummy append function for the shared input
  const dummyAppend = async () => {
    return null;
  };

  // Handle API key change
  const handleApiKeyChange = (modelId: string, apiKey: string) => {
    setApiKeys((prev) => ({ ...prev, [modelId]: apiKey }));
  };

  // Save API key
  const saveApiKey = async (modelId: string) => {
    try {
      const result = await upsertUserModelApiKey(modelId, apiKeys[modelId]);
      console.log("API key saved successfully", result);
      toast.success("API key saved successfully");
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast.error("Failed to save API key");
    }
  };

  // Remove API key
  const removeApiKey = async (modelId: string) => {
    try {
      await deleteUserModel(modelId);
      setApiKeys((prev) => {
        const newKeys = { ...prev };
        delete newKeys[modelId];
        return newKeys;
      });
      toast.success("API key removed successfully");
    } catch (error) {
      console.error("Failed to remove API key:", error);
      toast.error("Failed to remove API key");
    }
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <div className="flex justify-between items-center p-2 bg-background sticky top-0 z-10 border-b px-4 md:px-8">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          <h2 className="text-lg font-semibold flex items-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text mr-1">
              AI
            </span>
            <span>Benchmark</span>
          </h2>
        </div>
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
            className="md:px-2 md:h-[34px]"
          >
            {chatInstances.length > 0 ? "Change Models" : "Select Models"}
          </Button>
          {chatInstances.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(true)}
              className="md:px-2 md:h-[34px]"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {chatInstances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-6 max-w-2xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-medium">
              Benchmark de Modelos de Linguagem para Atendimento ao Cliente
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Esta ferramenta permite comparar o desempenho de diferentes
              modelos de linguagem (LLMs) em cenários de atendimento ao cliente.
              Seguindo metodologias estabelecidas em benchmarks como Chatbot
              Arena, MT-Bench e HELM, nossa plataforma possibilita avaliar
              modelos simultaneamente usando os mesmos prompts, permitindo uma
              análise comparativa direta.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Selecione os modelos que deseja testar, insira suas consultas, e
              observe como cada um responde às mesmas situações. Esta ferramenta
              foi desenvolvida como parte de uma pesquisa acadêmica sobre
              avaliação sistemática de LLMs para suporte ao cliente, visando
              identificar os modelos mais eficazes e estabelecer diretrizes para
              otimização de assistentes virtuais.
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="mt-2">
            Select Models
          </Button>
        </div>
      ) : (
        <>
          <div
            ref={chatContainersRef}
            className="grid gap-1 p-1 flex-1 overflow-hidden"
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
                className="border rounded overflow-hidden h-full chat-container"
                onScroll={handleScroll}
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
                  benchmarkId={currentBenchmarkId}
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

      {/* Reset confirmation dialog */}
      <Dialog
        open={isResetDialogOpen}
        onOpenChange={(open) =>
          startTransition(() => setIsResetDialogOpen(open))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Benchmark</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the benchmark? This will clear all
              current conversations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => startTransition(() => setIsResetDialogOpen(false))}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={resetBenchmark}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model selection dialog using models from database */}
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
            {isLoadingModels ? (
              <div className="text-center py-4">Loading models...</div>
            ) : models.length === 0 ? (
              <div className="text-center py-4">No models found</div>
            ) : (
              models.map((model) => {
                const displayName = `${model.provider} - ${model.officialName}`;

                return (
                  <div key={model.id} className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
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
                        <div>{displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.inputPriceMillionToken &&
                            `$${model.inputPriceMillionToken}/M tokens (input)`}
                          {model.outputPriceMillionToken &&
                            ` • $${model.outputPriceMillionToken}/M tokens (output)`}
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={apiKeys[model.id] || ""}
                        onChange={(e) =>
                          handleApiKeyChange(model.id, e.target.value)
                        }
                        placeholder="Enter API key"
                        className="input w-full text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => saveApiKey(model.id)}
                        className="text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeApiKey(model.id)}
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => startTransition(() => setIsDialogOpen(false))}
              disabled={isLoadingModels}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={startBenchmark}
              disabled={isLoadingModels || selectedModels.length === 0}
              className="text-xs"
            >
              Start Benchmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
