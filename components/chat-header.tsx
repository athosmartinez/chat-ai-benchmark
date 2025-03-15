"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import { memo } from "react";

import { ModelSelector } from "@/components/model-selector";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon, VercelIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Prompt, PromptSelector } from "./prompt-selector";
import { chatModels } from "../lib/ai/models";

function PureChatHeader({
  chatId,
  userId,
  selectedModelId,
  selectedPromptId,
  selectedPrompt,
  isReadonly,
  onPromptChange,
  isBenchmark = false
}: {
  chatId: string;
  userId: string | null;
  selectedModelId: string;
  selectedPromptId: string | null;
  selectedPrompt?: Prompt | null;
  isReadonly: boolean;
  onPromptChange?: (promptId: string) => void;
  isBenchmark?: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  const handlePromptChange = (promptId: string) => {
    if (onPromptChange) {
      onPromptChange(promptId);
    }
  };

  // Find the selected model to display its name
  const selectedModel = chatModels.find(model => model.id === selectedModelId);

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      {!isBenchmark && <SidebarToggle />}

      {!isBenchmark && (!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
        </Tooltip>
      )}

      {/* For benchmark mode, just display the model name */}
      {isBenchmark ? (
        <div className="text-sm font-medium flex-1 px-2 py-1 bg-muted rounded-md">
          {selectedModel?.name || selectedModelId}
        </div>
      ) : (
        <>
          {!isReadonly && (
            <ModelSelector
              selectedModelId={selectedModelId}
              className="order-1 md:order-2"
            />
          )}

          {!isReadonly && (
            <PromptSelector
              userId={userId}
              selectedPromptId={selectedPromptId}
              onPromptSelect={handlePromptChange}
              className="order-1 md:order-4"
            />
          )}
        </>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.selectedPromptId === nextProps.selectedPromptId
  );
});
