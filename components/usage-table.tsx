'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Search, User, Bot } from 'lucide-react';

interface UserStats {
  id: string;
  email: string;
  isGuest: boolean;
  stats: {
    totalChats: number;
    totalMessages: number;
    totalDocuments: number;
    totalSuggestions: number;
    totalVotes: number;
    messagesLast24h: number;
    lastChatAt: string | null;
    lastMessageAt: string | null;
    lastActiveAt: string | null;
  };
}

interface UsageTableProps {
  users: UserStats[];
  onUserClick: (userId: string) => void;
}

type SortField = 'email' | 'totalMessages' | 'messagesLast24h' | 'lastActiveAt';
type SortOrder = 'asc' | 'desc';

export function UsageTable({ users, onUserClick }: UsageTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalMessages');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue =
      sortField === 'email'
        ? a.email
        : sortField === 'lastActiveAt'
          ? a.stats.lastActiveAt || ''
          : a.stats[sortField];

    const bValue =
      sortField === 'email'
        ? b.email
        : sortField === 'lastActiveAt'
          ? b.stats.lastActiveAt || ''
          : b.stats[sortField];

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('email')}
                  className="h-auto p-0 font-medium"
                >
                  User
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('totalMessages')}
                  className="h-auto p-0 font-medium"
                >
                  Total Messages
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('messagesLast24h')}
                  className="h-auto p-0 font-medium"
                >
                  Last 24h
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Chats</TableHead>
              <TableHead className="text-center">Documents</TableHead>
              <TableHead className="text-center">Suggestions</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('lastActiveAt')}
                  className="h-auto p-0 font-medium"
                >
                  Last Active
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    {user.isGuest ? (
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {user.isGuest ? (
                    <Badge variant="secondary">Guest</Badge>
                  ) : (
                    <Badge variant="default">Regular</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {user.stats.totalMessages}
                </TableCell>
                <TableCell className="text-center">
                  {user.stats.messagesLast24h > 0 ? (
                    <Badge variant="outline">
                      {user.stats.messagesLast24h}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {user.stats.totalChats}
                </TableCell>
                <TableCell className="text-center">
                  {user.stats.totalDocuments}
                </TableCell>
                <TableCell className="text-center">
                  {user.stats.totalSuggestions}
                </TableCell>
                <TableCell>{formatDate(user.stats.lastActiveAt)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUserClick(user.id)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {sortedUsers.length} of {users.length} users
      </div>
    </div>
  );
}
