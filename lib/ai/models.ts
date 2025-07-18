export const DEFAULT_CHAT_MODEL: string = 'chat-model-building-code-chroma';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  // {
  //   id: 'chat-model',
  //   name: 'Chat model',
  //   description: 'Primary model for all-purpose chat',
  // },
  // {
  //   id: 'chat-model-reasoning',
  //   name: 'Reasoning model',
  //   description: 'Uses advanced reasoning',
  // },
  // {
  //   id: 'chat-model-chroma',
  //   name: 'Chroma DB Agent',
  //   description: 'AI agent with access to your Chroma vector database',
  // },
  // {
  //   id: 'chat-model-building-code',
  //   name: 'Building Code Agent',
  //   description: 'Specialized agent for building codes and zoning regulations',
  // },
  {
    id: 'chat-model-building-code-chroma',
    name: 'Building Code Chroma (Test)',
    description: 'Searches ChromaDB for building code information.',
  },
];
