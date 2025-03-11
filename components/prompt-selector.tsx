"use client";

import { useState, useEffect, startTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit, ChevronDown } from "lucide-react";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { savePromptIdAsCookie } from "@/app/(chat)/actions";
import { CheckCircleFillIcon } from "./icons";

import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

// Variável global para persistir o prompt selecionado
let persistedSelectedPrompt: Prompt | null = null;

export type Prompt = {
  id: string;
  name: string;
  prompt: string;
  userId: string;
  createdAt: Date;
};

interface PromptSelectorProps {
  userId?: string | null;
  selectedPromptId?: string | null;
  className?: string;
  onPromptSelect: (promptId: string) => void;
}

export function PromptSelector({
  selectedPromptId,
  className,
  onPromptSelect,
}: PromptSelectorProps) {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [optimisticPromptId, setOptimisticPromptId] = useOptimistic<
    string | null
  >(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [editPromptId, setEditPromptId] = useState("");
  const [editPromptName, setEditPromptName] = useState("");
  const [editPromptContent, setEditPromptContent] = useState("");

  const currentSelectedPrompt =
    prompts.find((p) => p.id === optimisticPromptId) || persistedSelectedPrompt;

  // Função para ler o cookie prompt-id
  const getPromptIdFromCookie = () => {
    const cookies = document.cookie.split("; ");
    const promptCookie = cookies.find((cookie) =>
      cookie.startsWith("prompt-id=")
    );
    return promptCookie ? promptCookie.split("=")[1] : null;
  };

  // Função para remover o cookie prompt-id
  const removePromptIdCookie = () => {
    document.cookie =
      "prompt-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  useEffect(() => {
    startTransition(() => {
      setOptimisticPromptId(
        persistedSelectedPrompt?.id || selectedPromptId || null
      );
    });
  }, [selectedPromptId]);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (selectedPromptId && prompts.length > 0) {
      const selected = prompts.find((p) => p.id === selectedPromptId);
      if (selected) {
        startTransition(() => {
          persistedSelectedPrompt = selected;
          setOptimisticPromptId(selected.id);
        });
      }
    }
  }, [selectedPromptId, prompts]);

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/prompts");
      if (!response.ok) throw new Error("Failed to fetch prompts");

      const promptsData = await response.json();
      setPrompts(promptsData);

      // Tenta selecionar o prompt do cookie primeiro
      const cookiePromptId = getPromptIdFromCookie();
      if (cookiePromptId && !persistedSelectedPrompt) {
        const selectedFromCookie = promptsData.find(
          (p: Prompt) => p.id === cookiePromptId
        );
        if (selectedFromCookie) {
          startTransition(() => {
            persistedSelectedPrompt = selectedFromCookie;
            setOptimisticPromptId(selectedFromCookie.id);
            onPromptSelect(selectedFromCookie.id);
            savePromptIdAsCookie(selectedFromCookie.id); // Garante que o cookie esteja atualizado
          });
        }
      }
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setOpen(false);
    startTransition(() => {
      persistedSelectedPrompt = prompt;
      setOptimisticPromptId(prompt.id);
      onPromptSelect(prompt.id);
      savePromptIdAsCookie(prompt.id);
    });
  };

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPromptName,
          prompt: newPromptContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to create prompt");

      const newPrompt = await response.json(); // Assume que a API retorna o prompt criado

      setNewPromptName("");
      setNewPromptContent("");
      setIsCreateDialogOpen(false);
      await loadPrompts();

      // Seleciona o prompt recém-criado automaticamente
      startTransition(() => {
        persistedSelectedPrompt = newPrompt;
        setOptimisticPromptId(newPrompt.id);
        onPromptSelect(newPrompt.id);
        savePromptIdAsCookie(newPrompt.id);
      });

      router.refresh();
    } catch (error) {
      console.error("Failed to create prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPrompt = async () => {
    if (!editPromptName.trim() || !editPromptContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editPromptId,
          name: editPromptName,
          prompt: editPromptContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to update prompt");

      setIsEditDialogOpen(false);
      await loadPrompts();
      router.refresh();
    } catch (error) {
      console.error("Failed to update prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (prompt: Prompt) => {
    setEditPromptId(prompt.id);
    setEditPromptName(prompt.name);
    setEditPromptContent(prompt.prompt);
    setIsEditDialogOpen(true);
  };

  const handleDeletePrompt = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prompts?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete prompt");

      await loadPrompts();

      // The issue is fixed here - wrapping the optimistic state update in startTransition
      if (persistedSelectedPrompt?.id === id) {
        startTransition(() => {
          persistedSelectedPrompt = null;
          setOptimisticPromptId(null); // Changed from empty string to null for consistency
          removePromptIdCookie(); // Remove o cookie se o prompt deletado era o selecionado
        });
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          className={cn(
            "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
            className
          )}
        >
          <Button variant="outline" className="md:px-2 md:h-[34px]">
            {currentSelectedPrompt?.name || "Select prompt"}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[300px]">
          {isLoading ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : (
            <>
              {prompts.length > 0 ? (
                prompts.map((prompt) => (
                  <DropdownMenuItem
                    key={prompt.id}
                    onSelect={() => handleSelectPrompt(prompt)}
                    className="gap-4 group/item flex flex-row justify-between items-center"
                    data-active={prompt.id === optimisticPromptId}
                  >
                    <div className="flex flex-col gap-1 items-start">
                      <div>{prompt.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {prompt.prompt.slice(0, 50)}...
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(prompt);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                        <CheckCircleFillIcon />
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No prompts found</DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="justify-center text-primary"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Prompt
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Prompt Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
            <DialogDescription>
              Create a new prompt template for your chats
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
                placeholder="E.g., Code Reviewer, Technical Writer..."
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="prompt">Prompt Template</label>
              <Textarea
                id="prompt"
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
                placeholder="Enter your prompt template..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePrompt} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prompt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Make changes to your prompt template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-name">Name</label>
              <Input
                id="edit-name"
                value={editPromptName}
                onChange={(e) => setEditPromptName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-prompt">Prompt Template</label>
              <Textarea
                id="edit-prompt"
                value={editPromptContent}
                onChange={(e) => setEditPromptContent(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditPrompt} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
