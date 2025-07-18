import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
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

console.log(
  '[Providers] Initializing provider, test environment:',
  isTestEnvironment,
);

// Check for required environment variables
if (!isTestEnvironment) {
  const requiredEnvVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(
      '[Providers] Missing required environment variables:',
      missingVars,
    );
    console.error(
      '[Providers] Please set the following environment variables:',
    );
    missingVars.forEach((varName) => {
      console.error(`  - ${varName}`);
    });
  } else {
    console.log('[Providers] All required environment variables are set');
  }
}

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
        'chat-model': (() => {
          console.log('[Providers] Creating openai gpt-4o model');
          try {
            return openai('gpt-4o');
          } catch (error) {
            console.error('[Providers] Failed to create chat-model:', error);
            throw error;
          }
        })(),
        'chat-model-reasoning': (() => {
          console.log('[Providers] Creating openai gpt-4o reasoning model');
          try {
            return wrapLanguageModel({
              model: openai('gpt-4o'),
              middleware: extractReasoningMiddleware({ tagName: 'think' }),
            });
          } catch (error) {
            console.error(
              '[Providers] Failed to create chat-model-reasoning:',
              error,
            );
            throw error;
          }
        })(),
        'chat-model-chroma': (() => {
          console.log('[Providers] Creating Chroma language model');
          try {
            return createChromaLanguageModel(createChromaAgent());
          } catch (error) {
            console.error(
              '[Providers] Failed to create chat-model-chroma:',
              error,
            );
            throw error;
          }
        })(),
        'chat-model-building-code': (() => {
          console.log('[Providers] Creating Building Code language model');
          try {
            return createBuildingCodeLanguageModel(createBuildingCodeAgent());
          } catch (error) {
            console.error(
              '[Providers] Failed to create chat-model-building-code:',
              error,
            );
            throw error;
          }
        })(),
        'chat-model-building-code-chroma': (() => {
          console.log(
            '[Providers] Creating building-code-chroma model with openai gpt-4o',
          );
          try {
            return wrapLanguageModel({
              model: openai('gpt-4o'),
              middleware: extractReasoningMiddleware({ tagName: 'think' }),
            });
          } catch (error) {
            console.error(
              '[Providers] Failed to create chat-model-building-code-chroma:',
              error,
            );
            throw error;
          }
        })(),
        'title-model': openai('gpt-4o'),
        'artifact-model': openai('gpt-4o'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
      },
    });

console.log('[Providers] Provider initialized');
