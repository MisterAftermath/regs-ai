import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
  tool,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
  getActiveAnnotationsByUserId,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { searchChromaDb } from '@/lib/ai/tools/search-chroma-db';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      // Check if REDIS_URL is set and valid
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        console.log('[Chat API] REDIS_URL not set, resumable streams disabled');
        return null;
      }

      // Try to parse the URL to validate it
      try {
        new URL(redisUrl);
      } catch (urlError) {
        console.error('[Chat API] Invalid REDIS_URL format:', urlError);
        return null;
      }

      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
      console.log('[Chat API] Resumable stream context created successfully');
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          '[Chat API] Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(
          '[Chat API] Failed to create resumable stream context:',
          error,
        );
      }
      // Return null to disable resumable streams on any error
      return null;
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  console.log('[Chat API] POST request received');
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    console.log('[Chat API] Request body:', JSON.stringify(json, null, 2));
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.error('[Chat API] Failed to parse request body:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      jurisdictionId,
    } = requestBody;

    console.log('[Chat API] Processing chat request:', {
      chatId: id,
      model: selectedChatModel,
      visibility: selectedVisibilityType,
      jurisdictionId,
      messageId: message.id,
    });

    const session = await auth();

    if (!session?.user) {
      console.log('[Chat API] No authenticated user');
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    console.log('[Chat API] Authenticated user:', session.user.id);

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    console.log('[Chat API] User message count (24h):', messageCount);

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      console.log('[Chat API] Rate limit exceeded');
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      console.log('[Chat API] Creating new chat');
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      console.log('[Chat API] Using existing chat');
      if (chat.userId !== session.user.id) {
        console.log('[Chat API] User does not own chat');
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await getMessagesByChatId({ id });
    console.log('[Chat API] Previous messages count:', previousMessages.length);

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    console.log('[Chat API] Request hints:', requestHints);

    // Fetch user annotations
    const userAnnotations = await getActiveAnnotationsByUserId(session.user.id);
    console.log('[Chat API] User annotations count:', userAnnotations.length);

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });
    console.log('[Chat API] Created stream ID:', streamId);

    const stream = createDataStream({
      execute: (dataStream) => {
        console.log('[Chat API] Creating data stream');

        // Create a custom searchChromaDb tool with jurisdiction context
        const searchChromaDbWithJurisdiction = tool({
          description: searchChromaDb.description,
          parameters: searchChromaDb.parameters,
          execute: async ({
            query,
            limit,
          }: { query: string; limit?: number }) => {
            console.log('[Chat API] Executing searchChromaDb tool:', {
              query,
              limit,
              jurisdictionId,
            });
            // @ts-ignore - jurisdiction is not in the original parameters but we're adding it
            return searchChromaDb.execute({ query, jurisdictionId, limit });
          },
        });

        console.log(
          '[Chat API] Configuring streamText with model:',
          selectedChatModel,
        );

        try {
          const model = myProvider.languageModel(selectedChatModel);
          console.log('[Chat API] Model retrieved successfully:', {
            modelId: selectedChatModel,
            modelType: typeof model,
            hasModel: !!model,
          });
        } catch (error) {
          console.error('[Chat API] Failed to retrieve model:', error);
          throw error;
        }

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({
            selectedChatModel,
            requestHints,
            userAnnotations: userAnnotations.map((a) => ({
              title: a.title,
              content: a.content,
            })),
          }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : selectedChatModel === 'chat-model-chroma'
                ? [] // Chroma agent handles its own tools internally
                : selectedChatModel === 'chat-model-building-code'
                  ? [] // Building Code agent handles its own tools internally
                  : selectedChatModel === 'chat-model-building-code-chroma'
                    ? [
                        'searchChromaDb',
                        'createDocument',
                        'updateDocument',
                        'requestSuggestions',
                      ]
                    : [
                        'getWeather',
                        'createDocument',
                        'updateDocument',
                        'requestSuggestions',
                      ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            searchChromaDb: searchChromaDbWithJurisdiction,
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            console.log(
              '[Chat API] Stream finished, response messages:',
              response.messages.length,
            );
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
                console.log('[Chat API] Assistant message saved');
              } catch (error) {
                console.error('[Chat API] Failed to save chat:', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        console.log('[Chat API] Consuming stream');
        result.consumeStream();

        console.log('[Chat API] Merging into data stream');
        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('[Chat API] Stream error:', error);
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();
    console.log('[Chat API] Stream context available:', !!streamContext);

    try {
      if (streamContext) {
        console.log(
          '[Chat API] Attempting to create resumable stream response',
        );
        const resumableStream = await streamContext.resumableStream(
          streamId,
          () => stream,
        );
        console.log('[Chat API] Resumable stream created successfully');
        return new Response(resumableStream);
      } else {
        console.log('[Chat API] Returning direct stream response (no Redis)');
        return new Response(stream);
      }
    } catch (resumableError) {
      console.error(
        '[Chat API] Failed to create resumable stream, falling back to regular stream:',
        resumableError,
      );
      // Fall back to regular streaming if resumable stream fails
      return new Response(stream);
    }
  } catch (error) {
    console.error('[Chat API] Unexpected error:', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    // Return a generic error response for unexpected errors
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
