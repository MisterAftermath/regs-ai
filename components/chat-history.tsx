'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/toast';
import {
  MessageSquare,
  ExternalLink,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import type { Chat } from '@/lib/db/schema';

interface ChatHistoryProps {
  userId: string;
}

interface ChatHistory {
  chats: Chat[];
  hasMore: boolean;
}

export function ChatHistory({ userId }: ChatHistoryProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [startingAfter, setStartingAfter] = useState<string | null>(null);
  const [endingBefore, setEndingBefore] = useState<string | null>(null);

  const fetchChats = async (cursor?: {
    startingAfter?: string;
    endingBefore?: string;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId, limit: '10' });
      if (cursor?.startingAfter)
        params.append('starting_after', cursor.startingAfter);
      if (cursor?.endingBefore)
        params.append('ending_before', cursor.endingBefore);

      const response = await fetch(`/usage/api/chats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to load chat history.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [userId]);

  const handlePreviousPage = () => {
    if (chatHistory?.chats[0]) {
      setEndingBefore(chatHistory.chats[0].id);
      setStartingAfter(null);
      fetchChats({ endingBefore: chatHistory.chats[0].id });
    }
  };

  const handleNextPage = () => {
    if (chatHistory?.chats[chatHistory.chats.length - 1]) {
      setStartingAfter(chatHistory.chats[chatHistory.chats.length - 1].id);
      setEndingBefore(null);
      fetchChats({
        startingAfter: chatHistory.chats[chatHistory.chats.length - 1].id,
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading && !chatHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
          <CardDescription>Loading user chat history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={`chat-skeleton-${i}`} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredChats =
    chatHistory?.chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Chat History</CardTitle>
          <CardDescription>
            Browse through all conversations for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No chats found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChats.map((chat) => (
                    <TableRow key={chat.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[300px]">
                            {chat.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span title={formatDate(chat.createdAt)}>
                            {formatRelativeTime(chat.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            chat.visibility === 'public'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {chat.visibility}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          title="Open chat (read-only for admin)"
                        >
                          <Link href={`/${chat.id}`} target="_blank">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            View Chat
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredChats.length} of {chatHistory?.chats.length || 0}{' '}
              chats
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={!endingBefore && !startingAfter}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!chatHistory?.hasMore}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
