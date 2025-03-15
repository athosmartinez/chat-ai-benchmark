import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { Benchmark } from '@/components/benchmark';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const promptIdFromCookie = cookieStore.get('prompt-id');
  
  return (
    <>
      <Benchmark 
        initialPromptId={promptIdFromCookie?.value}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
