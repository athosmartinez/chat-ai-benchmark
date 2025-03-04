'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export type Prompt = {
  id: string;
  name: string;
  prompt: string;
  userId: string;
  createdAt: Date;
};

interface PromptSelectorProps {
  userId: string;
  selectedPromptId: string;
  className?: string;
  onPromptSelect: (promptId: string) => void;
}

export function PromptSelector({
  userId,
  selectedPromptId,
  className,
  onPromptSelect,
}: PromptSelectorProps) {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');

  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/prompts');
      if (!response.ok) throw new Error('Failed to fetch prompts');
      
      const promptsData = await response.json();
      setPrompts(promptsData);
      
      if (selectedPromptId) {
        const selected = promptsData.find((p: Prompt) => p.id === selectedPromptId);
        setSelectedPrompt(selected || null);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPromptId) {
      const selected = prompts.find(p => p.id === selectedPromptId);
      setSelectedPrompt(selected || null);
    }
  }, [selectedPromptId, prompts]);

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPromptName,
          prompt: newPromptContent,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create prompt');
      
      setNewPromptName('');
      setNewPromptContent('');
      setIsCreateDialogOpen(false);
      await loadPrompts();
      router.refresh();
    } catch (error) {
      console.error('Failed to create prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prompts?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete prompt');
      
      await loadPrompts();
      router.refresh();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (promptId: string) => {
    onPromptSelect(promptId);
    const selected = prompts.find(p => p.id === promptId);
    setSelectedPrompt(selected || null);
  };

  return (
    <div className={className}>
      <DropdownMenu onOpenChange={loadPrompts}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 px-2">
                {selectedPrompt?.name || 'Select Prompt'}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-56">
          {isLoading ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : (
            <>
              {prompts.length > 0 ? (
                prompts.map((prompt) => (
                  <DropdownMenuItem
                    key={prompt.id}
                    className="flex justify-between items-center"
                    onClick={() => handleSelectPrompt(prompt.id)}
                  >
                    <span className={prompt.id === selectedPromptId ? "font-bold" : ""}>
                      {prompt.name}
                    </span>
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
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePrompt} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
