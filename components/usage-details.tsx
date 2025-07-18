'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Code,
  Image,
  Sheet,
  MessageSquare,
  Bot,
  User,
} from 'lucide-react';
import { ChatHistory } from './chat-history';

interface DetailedUserStats {
  user: {
    id: string;
    email: string;
    isGuest: boolean;
  };
  stats: {
    chats: {
      total: number;
      public: number;
      private: number;
    };
    messages: {
      total: number;
      userMessages: number;
      assistantMessages: number;
    };
    documents: {
      total: number;
      text: number;
      code: number;
      image: number;
      sheet: number;
    };
    dailyMessages: Array<{ date: string; count: number }>;
  };
}

interface UsageDetailsProps {
  user: DetailedUserStats;
  loading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function UsageDetails({ user, loading }: UsageDetailsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const documentData = [
    { name: 'Text', value: user.stats.documents.text, icon: FileText },
    { name: 'Code', value: user.stats.documents.code, icon: Code },
    { name: 'Image', value: user.stats.documents.image, icon: Image },
    { name: 'Sheet', value: user.stats.documents.sheet, icon: Sheet },
  ].filter((item) => item.value > 0);

  const messageRatio =
    user.stats.messages.total > 0
      ? (user.stats.messages.userMessages / user.stats.messages.total) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user.user.isGuest ? (
            <Bot className="h-8 w-8 text-muted-foreground" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-xl font-semibold">{user.user.email}</h2>
            <Badge variant={user.user.isGuest ? 'secondary' : 'default'}>
              {user.user.isGuest ? 'Guest User' : 'Regular User'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.chats.total}</div>
            <p className="text-xs text-muted-foreground">
              {user.stats.chats.public} public, {user.stats.chats.private}{' '}
              private
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.stats.messages.total}
            </div>
            <Progress value={messageRatio} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(messageRatio)}% user messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.stats.documents.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {documentData.length} types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.stats.dailyMessages[0]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Messages today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="chats">Chat History</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Message Activity</CardTitle>
              <CardDescription>
                Messages sent per day over the last week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={user.stats.dailyMessages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('en', {
                          weekday: 'short',
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Types</CardTitle>
              <CardDescription>
                Distribution of document types created
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={documentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {documentData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No documents created yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Breakdown</CardTitle>
              <CardDescription>User vs Assistant messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Messages</span>
                  <span className="text-sm text-muted-foreground">
                    {user.stats.messages.userMessages}
                  </span>
                </div>
                <Progress
                  value={
                    (user.stats.messages.userMessages /
                      user.stats.messages.total) *
                    100
                  }
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Assistant Messages
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user.stats.messages.assistantMessages}
                  </span>
                </div>
                <Progress
                  value={
                    (user.stats.messages.assistantMessages /
                      user.stats.messages.total) *
                    100
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats" className="space-y-4">
          <ChatHistory userId={user.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
