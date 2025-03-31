"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";

// First, let's define interfaces for the benchmark and chat data
interface BenchmarkChat {
  id: string;
  title: string;
  createdAt: string | Date;
  benchmarkId: string;
}

interface Benchmark {
  id: string;
  title: string;
  createdAt: string | Date;
  chats: BenchmarkChat[];
}

export function SidebarHistory({ user }: { user: User }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();

  // Existing chat history SWR
  const {
    data: history,
    isLoading: isHistoryLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? "/api/history" : null, fetcher, {
    fallbackData: [],
  });

  // NEW: Add SWR for benchmarks with type annotation
  const { data: benchmarks = [], isLoading: isBenchmarksLoading } = useSWR<Benchmark[]>(
    user ? "/api/getBenchmarksByUserId" : null,
    fetcher
  );

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  // Keep existing state and handlers for chat deletion
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push("/");
    }
  };

  if (isHistoryLoading || isBenchmarksLoading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SidebarMenuSkeleton key={i} showIcon />
        ))}
      </div>
    );
  }

  // Show benchmarks when available
  if (benchmarks && benchmarks.length > 0) {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {benchmarks.map((benchmark: Benchmark) => (
                <SidebarMenuItem key={benchmark.id}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={`/benchmark/${benchmark.id}`}
                      onClick={() => setOpenMobile(false)}
                    >
                      <span>{benchmark.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  {benchmark.chats && benchmark.chats.length > 0 && (
                    <SidebarMenu className="pl-4 mt-1">
                      {benchmark.chats.map((chat: BenchmarkChat) => (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={chat.id === id}
                            size="sm"
                          >
                            <Link
                              href={`/chat/${chat.id}`}
                              onClick={() => setOpenMobile(false)}
                            >
                              <span>{chat.title}</span>
                            </Link>
                          </SidebarMenuButton>
                          {/* Add Trash Icon to delete chat */}
                          <SidebarMenuAction
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <TrashIcon />
                          </SidebarMenuAction>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Keep the dialog for deleting chats */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza que deseja excluir este chat?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o chat e o removerá dos nossos servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Sim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Show message when no benchmarks are available
  if (!benchmarks || benchmarks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
          Your benchmarks will appear here once you create them!
        </div>
      </div>
    );
  }

  // Fallback to original chat history (this probably won't be reached)
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {/* Original chat history rendering code */}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        {/* ... */}
      </AlertDialog>
    </>
  );
}