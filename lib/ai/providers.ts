import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { createChromaAgent, createChromaLanguageModel } from './chroma-agent';
import {
  createBuildingCodeAgent,
  createBuildingCodeLanguageModel,
} from './agents/building-code';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'chat-model-chroma': createChromaLanguageModel(createChromaAgent()),
        'chat-model-building-code': createBuildingCodeLanguageModel(
          createBuildingCodeAgent(),
        ),
        'chat-model-building-code-chroma': chatModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'chat-model-chroma': createChromaLanguageModel(createChromaAgent()),
        'chat-model-building-code': createBuildingCodeLanguageModel(
          createBuildingCodeAgent(),
        ),
        'chat-model-building-code-chroma': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
