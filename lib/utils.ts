import type { CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { CoreMessage } from 'ai';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        const { code, cause } = errorData;

        // If code is missing or invalid, throw a generic error based on status
        if (!code || typeof code !== 'string' || !code.includes(':')) {
          console.error(
            '[fetchWithErrorHandlers] Invalid error response:',
            errorData,
          );

          // Map status codes to appropriate error codes
          let errorCode: ErrorCode = 'bad_request:api';
          if (response.status === 401) errorCode = 'unauthorized:api';
          else if (response.status === 403) errorCode = 'forbidden:api';
          else if (response.status === 404) errorCode = 'not_found:api';
          else if (response.status === 429) errorCode = 'rate_limit:api';
          else if (response.status >= 500) errorCode = 'bad_request:api'; // Server errors

          throw new ChatSDKError(
            errorCode,
            errorData.error || errorData.message || 'Server error',
          );
        }

        throw new ChatSDKError(code as ErrorCode, cause);
      } catch (parseError) {
        // If we can't parse the JSON, throw a generic error
        console.error(
          '[fetchWithErrorHandlers] Failed to parse error response:',
          parseError,
        );
        throw new ChatSDKError(
          'bad_request:api',
          `Server returned ${response.status} ${response.statusText}`,
        );
      }
    }

    return response;
  } catch (error: unknown) {
    // If it's already a ChatSDKError, re-throw it
    if (error instanceof ChatSDKError) {
      throw error;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

/**
 * Extracts the text content from a CoreMessage's content field.
 * Handles both string and array (multi-modal) content.
 * @param content - The content from a CoreMessage.
 * @returns The extracted text as a string.
 */
export function extractTextFromContent(
  content: CoreMessage['content'] | undefined,
): string {
  if (!content) {
    return '';
  }

  if (typeof content === 'string') {
    return content;
  }

  // Find the first text part in the array of content parts.
  const textPart = content.find((part) => part.type === 'text');

  if (textPart && 'text' in textPart) {
    return textPart.text;
  }

  return '';
}

export function px(value: number) {
  return `${value / 16}rem`;
}

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;

  // Define admin emails or patterns here
  // For now, let's use a simple approach - you can customize this
  const adminEmails = [
    'randommason3@gmail.com',
    // Add more admin emails here
  ];

  // Check if email is in admin list
  if (adminEmails.includes(email)) return true;

  return false;
}
