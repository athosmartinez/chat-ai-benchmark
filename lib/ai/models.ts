import { openai } from '@ai-sdk/openai';
import { deepseek } from '@ai-sdk/deepseek';
import { xai } from '@ai-sdk/xai'; 
import { google } from '@ai-sdk/google';
import { perplexity } from '@ai-sdk/perplexity';
import { fireworks } from '@ai-sdk/fireworks';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'chat-model-openai-defaultl';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-openai-mini': openai('gpt-4o-mini'),
    'chat-model-openai-default': openai('gpt-4o'),
    'chat-model-perplexity': perplexity('sonar-prot'),
    'chat-model-google': google('gemini-2.0-flash'),
    'chat-model-xai': xai('grok-2-1212'),
    'chat-model-deepseek': deepseek('deepseek-chat'),
    // 'chat-model-reasoning': wrapLanguageModel({
    //   model: fireworks('accounts/fireworks/models/deepseek-r1'),
    //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
    // }),
    'title-model': openai('gpt-4o-mini'),
    'artifact-model': openai('gpt-4o-mini'),
  },
  imageModels: {
    // 'small-model': openai.image('dall-e-2'),
    // 'large-model': openai.image('dall-e-3'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-openai-mini',
    name: 'openai - gpt-4o-mini',
    description: '',
  },
  {
    id: 'chat-model-openai-default',
    name: 'openai - gpt-4o',
    description: '',
  },
  {
    id: 'chat-model-perplexity',
    name: 'perplexity - sonar-pro',
    description: '',
  },
  {
    id: 'chat-model-google',
    name: 'google gemini - gemini-2.0-flash',
    description: '',
  },
  {
    id: 'chat-model-xai',
    name: 'xai - grok-2-1212',
    description: '',
  },
  {
    id: 'chat-model-deepseek',
    name: 'deepseek - deepseek-chat',
    description: '',
  },
];
