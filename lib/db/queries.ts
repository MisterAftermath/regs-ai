import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  annotation,
  type Annotation,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  console.log('[DB] Getting user with email:', email);
  try {
    const users = await db.select().from(user).where(eq(user.email, email));
    console.log('[DB] Query completed, found users:', users.length);
    return users;
  } catch (error) {
    console.error('[DB] Error getting user:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

// Usage statistics queries
export async function getAllUsersUsageStats() {
  try {
    const users = await db.select().from(user).orderBy(asc(user.email));

    const userStats = await Promise.all(
      users.map(async (u) => {
        // Get chat stats
        const [chatStats] = await db
          .select({ count: count(chat.id) })
          .from(chat)
          .where(eq(chat.userId, u.id))
          .execute();

        // Get message stats
        const [messageStats] = await db
          .select({ count: count(message.id) })
          .from(message)
          .innerJoin(chat, eq(message.chatId, chat.id))
          .where(and(eq(chat.userId, u.id), eq(message.role, 'user')))
          .execute();

        // Get document stats
        const [documentStats] = await db
          .select({ count: count(document.id) })
          .from(document)
          .where(eq(document.userId, u.id))
          .execute();

        // Get suggestion stats
        const [suggestionStats] = await db
          .select({ count: count(suggestion.id) })
          .from(suggestion)
          .where(eq(suggestion.userId, u.id))
          .execute();

        // Get vote stats
        const [voteStats] = await db
          .select({ count: count(vote.messageId) })
          .from(vote)
          .innerJoin(chat, eq(vote.chatId, chat.id))
          .where(eq(chat.userId, u.id))
          .execute();

        // Get latest activity
        const [latestChat] = await db
          .select({ createdAt: chat.createdAt })
          .from(chat)
          .where(eq(chat.userId, u.id))
          .orderBy(desc(chat.createdAt))
          .limit(1)
          .execute();

        const [latestMessage] = await db
          .select({ createdAt: message.createdAt })
          .from(message)
          .innerJoin(chat, eq(message.chatId, chat.id))
          .where(and(eq(chat.userId, u.id), eq(message.role, 'user')))
          .orderBy(desc(message.createdAt))
          .limit(1)
          .execute();

        // Get messages in last 24 hours
        const messagesLast24h = await getMessageCountByUserId({
          id: u.id,
          differenceInHours: 24,
        });

        return {
          id: u.id,
          email: u.email,
          isGuest: u.email.startsWith('guest-'),
          stats: {
            totalChats: chatStats?.count ?? 0,
            totalMessages: messageStats?.count ?? 0,
            totalDocuments: documentStats?.count ?? 0,
            totalSuggestions: suggestionStats?.count ?? 0,
            totalVotes: voteStats?.count ?? 0,
            messagesLast24h,
            lastChatAt: latestChat?.createdAt ?? null,
            lastMessageAt: latestMessage?.createdAt ?? null,
            lastActiveAt:
              latestMessage?.createdAt ?? latestChat?.createdAt ?? null,
          },
        };
      }),
    );

    return userStats;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all users usage stats',
    );
  }
}

export async function getUsageStatsByUserId({ userId }: { userId: string }) {
  try {
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!targetUser) {
      throw new ChatSDKError('not_found:database', 'User not found');
    }

    // Get detailed stats for a specific user
    const [totalChatStats] = await db
      .select({ count: count(chat.id) })
      .from(chat)
      .where(eq(chat.userId, userId))
      .execute();

    const [publicChatStats] = await db
      .select({ count: count(chat.id) })
      .from(chat)
      .where(and(eq(chat.userId, userId), eq(chat.visibility, 'public')))
      .execute();

    const [privateChatStats] = await db
      .select({ count: count(chat.id) })
      .from(chat)
      .where(and(eq(chat.userId, userId), eq(chat.visibility, 'private')))
      .execute();

    const [totalMessageStats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(eq(chat.userId, userId))
      .execute();

    const [userMessageStats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(and(eq(chat.userId, userId), eq(message.role, 'user')))
      .execute();

    const [assistantMessageStats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(and(eq(chat.userId, userId), eq(message.role, 'assistant')))
      .execute();

    const [totalDocStats] = await db
      .select({ count: count(document.id) })
      .from(document)
      .where(eq(document.userId, userId))
      .execute();

    const [textDocStats] = await db
      .select({ count: count(document.id) })
      .from(document)
      .where(and(eq(document.userId, userId), eq(document.kind, 'text')))
      .execute();

    const [codeDocStats] = await db
      .select({ count: count(document.id) })
      .from(document)
      .where(and(eq(document.userId, userId), eq(document.kind, 'code')))
      .execute();

    const [imageDocStats] = await db
      .select({ count: count(document.id) })
      .from(document)
      .where(and(eq(document.userId, userId), eq(document.kind, 'image')))
      .execute();

    const [sheetDocStats] = await db
      .select({ count: count(document.id) })
      .from(document)
      .where(and(eq(document.userId, userId), eq(document.kind, 'sheet')))
      .execute();

    // Get daily message counts for the last 7 days
    const dailyMessages = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return db
          .select({
            count: count(message.id),
          })
          .from(message)
          .innerJoin(chat, eq(message.chatId, chat.id))
          .where(
            and(
              eq(chat.userId, userId),
              eq(message.role, 'user'),
              gte(message.createdAt, startDate),
              lt(message.createdAt, endDate),
            ),
          )
          .execute()
          .then(([result]) => ({
            date: startDate.toISOString().split('T')[0],
            count: result?.count ?? 0,
          }));
      }),
    );

    return {
      user: {
        id: targetUser.id,
        email: targetUser.email,
        isGuest: targetUser.email.startsWith('guest-'),
      },
      stats: {
        chats: {
          total: totalChatStats?.count ?? 0,
          public: publicChatStats?.count ?? 0,
          private: privateChatStats?.count ?? 0,
        },
        messages: {
          total: totalMessageStats?.count ?? 0,
          userMessages: userMessageStats?.count ?? 0,
          assistantMessages: assistantMessageStats?.count ?? 0,
        },
        documents: {
          total: totalDocStats?.count ?? 0,
          text: textDocStats?.count ?? 0,
          code: codeDocStats?.count ?? 0,
          image: imageDocStats?.count ?? 0,
          sheet: sheetDocStats?.count ?? 0,
        },
        dailyMessages: dailyMessages.reverse(),
      },
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get usage stats by user id',
    );
  }
}

// Annotation queries
export async function getAnnotationsByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(annotation)
      .where(eq(annotation.userId, userId))
      .orderBy(desc(annotation.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get annotations by user id',
    );
  }
}

export async function getActiveAnnotationsByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(annotation)
      .where(and(eq(annotation.userId, userId), eq(annotation.isActive, true)))
      .orderBy(desc(annotation.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get active annotations by user id',
    );
  }
}

export async function getAnnotationById(id: string) {
  try {
    const [result] = await db
      .select()
      .from(annotation)
      .where(eq(annotation.id, id))
      .limit(1);
    return result || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get annotation by id',
    );
  }
}

export async function createAnnotation({
  userId,
  title,
  content,
  category,
}: {
  userId: string;
  title: string;
  content: string;
  category?: string;
}) {
  try {
    const [newAnnotation] = await db
      .insert(annotation)
      .values({
        userId,
        title,
        content,
        category,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newAnnotation;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create annotation',
    );
  }
}

export async function updateAnnotation({
  id,
  title,
  content,
  category,
  isActive,
}: {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  isActive?: boolean;
}) {
  try {
    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedAnnotation] = await db
      .update(annotation)
      .set(updateData)
      .where(eq(annotation.id, id))
      .returning();
    return updatedAnnotation;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update annotation',
    );
  }
}

export async function deleteAnnotation(id: string) {
  try {
    const [deletedAnnotation] = await db
      .delete(annotation)
      .where(eq(annotation.id, id))
      .returning();
    return deletedAnnotation;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete annotation',
    );
  }
}
