'use client';

import { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessingJob {
  id: string;
  documentName: string;
  documentSize: number;
  status: 'queued' | 'processing' | 'completed' | 'error' | 'paused';
  progress: number;
  chunksProcessed: number;
  totalChunks: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Mock data - replace with actual API calls
const mockJobs: ProcessingJob[] = [
  {
    id: '1',
    documentName: 'Chapter 1 - Administration.pdf',
    documentSize: 2048000,
    status: 'processing',
    progress: 65,
    chunksProcessed: 13,
    totalChunks: 20,
    startedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '2',
    documentName: 'Chapter 2 - Definitions.pdf',
    documentSize: 1536000,
    status: 'queued',
    progress: 0,
    chunksProcessed: 0,
    totalChunks: 15,
  },
  {
    id: '3',
    documentName: 'Chapter 3 - Use and Occupancy.pdf',
    documentSize: 3072000,
    status: 'completed',
    progress: 100,
    chunksProcessed: 25,
    totalChunks: 25,
    startedAt: new Date(Date.now() - 20 * 60 * 1000),
    completedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
];

export function ProcessingQueue() {
  const [jobs, setJobs] = useState<ProcessingJob[]>(mockJobs);
  const [isPaused, setIsPaused] = useState(false);

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return (
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        );
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'queued':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'success';
      case 'error':
        return 'destructive';
      case 'paused':
        return 'warning';
    }
  };

  const formatDuration = (startedAt?: Date, completedAt?: Date) => {
    if (!startedAt) return '-';
    const end = completedAt || new Date();
    const duration = Math.floor((end.getTime() - startedAt.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const activeJobs = jobs.filter((j) => j.status === 'processing').length;
  const queuedJobs = jobs.filter((j) => j.status === 'queued').length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Processing Queue</h2>
          <p className="text-sm text-muted-foreground">
            {activeJobs} active, {queuedJobs} queued, {completedJobs} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause All
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <RotateCw className="h-4 w-4 mr-2" />
            Retry Failed
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={cn(
              'border rounded-lg p-4 space-y-3',
              job.status === 'error' && 'border-red-200 bg-red-50',
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{job.documentName}</p>
                    <Badge variant={getStatusColor(job.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(job.status)}
                        {job.status}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(job.documentSize)} • {job.totalChunks}{' '}
                    chunks
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {formatDuration(job.startedAt, job.completedAt)}
                </p>
              </div>
            </div>

            {job.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {job.chunksProcessed} of {job.totalChunks} chunks
                  </span>
                  <span>{job.progress}%</span>
                </div>
                <Progress value={job.progress} />
              </div>
            )}

            {job.error && (
              <div className="bg-red-100 border border-red-200 rounded p-2">
                <p className="text-sm text-red-800">{job.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No documents in processing queue</p>
        </div>
      )}
    </div>
  );
}
