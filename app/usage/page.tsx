'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/toast';
import { UsageTable } from '@/components/usage-table';
import { UsageDetails } from '@/components/usage-details';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { isAdminUser } from '@/lib/utils';

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

export default function UsagePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [allUsers, setAllUsers] = useState<UserStats[]>([]);
  const [selectedUser, setSelectedUser] = useState<DetailedUserStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Admin access check
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || !isAdminUser(session.user.email)) {
      toast({
        type: 'error',
        description: 'Access denied. Admin privileges required.',
      });
      router.push('/');
    }
  }, [session, status, router]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/usage/api');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          toast({
            type: 'error',
            description: 'You do not have permission to view usage statistics.',
          });
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch usage data');
      }
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to load usage statistics.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/usage/api?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      const data = await response.json();
      setSelectedUser(data);
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to load user details.',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllUsers();
  };

  const handleUserClick = (userId: string) => {
    fetchUserDetails(userId);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Usage Explorer</h1>
          <div className="flex gap-2">
            {selectedUser && (
              <Button variant="outline" onClick={handleBackToList}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {selectedUser ? (
          <UsageDetails user={selectedUser} loading={loadingDetails} />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Users
                </h3>
                <p className="text-2xl font-bold">{allUsers.length}</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Active Users
                </h3>
                <p className="text-2xl font-bold">
                  {allUsers.filter((u) => u.stats.messagesLast24h > 0).length}
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Guest Users
                </h3>
                <p className="text-2xl font-bold">
                  {allUsers.filter((u) => u.isGuest).length}
                </p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Regular Users
                </h3>
                <p className="text-2xl font-bold">
                  {allUsers.filter((u) => !u.isGuest).length}
                </p>
              </Card>
            </div>

            <UsageTable users={allUsers} onUserClick={handleUserClick} />
          </>
        )}
      </Card>
    </div>
  );
}
