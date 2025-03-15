"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
} from "react";

import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";
import { getModels } from "@/app/(models)/actions";
import { Models } from "@/lib/db/schema";

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  const [models, setModels] = useState<Models[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch models from the database
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        const dbModels = await getModels();
        setModels(dbModels);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === optimisticModelId),
    [models, optimisticModelId]
  );

  const displayName = selectedModel
    ? `${selectedModel.provider} - ${selectedModel.officialName}`
    : isLoading
    ? "Loading models..."
    : "Select a model";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          variant="outline"
          className="md:px-2 md:h-[34px]"
          disabled={isLoading}
        >
          {displayName}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {models.map((model) => {
          const displayName = `${model.provider} - ${model.officialName}`;

          return (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModelId(model.id);
                  saveChatModelAsCookie(model.id);
                });
              }}
              className="gap-4 group/item flex flex-row justify-between items-center"
              data-active={model.id === optimisticModelId}
            >
              <div className="flex flex-col gap-1 items-start">
                <div>{displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {model.inputPriceMillionToken &&
                    `$${model.inputPriceMillionToken}/M tokens (input)`}
                  {model.outputPriceMillionToken &&
                    ` • $${model.outputPriceMillionToken}/M tokens (output)`}
                </div>
              </div>

              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
