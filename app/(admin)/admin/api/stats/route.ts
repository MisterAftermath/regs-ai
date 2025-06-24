import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  databaseAdapter,
  vectorAdapter,
} from '@/app/(admin)/admin/ingestion/_lib/adapters';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get processing queue stats
    const jobs = await databaseAdapter.getProcessingQueue();
    const queueStats = {
      queued: jobs.filter((j) => j.status === 'queued').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      error: jobs.filter((j) => j.status === 'error').length,
      paused: jobs.filter((j) => j.status === 'paused').length,
      total: jobs.length,
    };

    // Get document stats
    const documents = await databaseAdapter.getDocumentsByPath('');
    const documentStats = {
      total: documents.length,
      pending: documents.filter((d) => d.status === 'pending').length,
      processing: documents.filter((d) => d.status === 'processing').length,
      completed: documents.filter((d) => d.status === 'completed').length,
      error: documents.filter((d) => d.status === 'error').length,
      totalSize: documents.reduce((sum, d) => sum + (d.size || 0), 0),
    };

    // Get documents by jurisdiction
    const documentsByJurisdiction: Record<string, number> = {};
    documents.forEach((doc) => {
      const jurisdiction = doc.metadata?.jurisdiction || 'unspecified';
      documentsByJurisdiction[jurisdiction] =
        (documentsByJurisdiction[jurisdiction] || 0) + 1;
    });

    // Get documents by code type
    const documentsByCodeType: Record<string, number> = {};
    documents.forEach((doc) => {
      const codeType = doc.metadata?.codeType || 'unspecified';
      documentsByCodeType[codeType] = (documentsByCodeType[codeType] || 0) + 1;
    });

    // Get vector database stats
    const vectorStats = await vectorAdapter.getIndexStats();

    // Calculate average processing time
    const completedJobs = jobs.filter(
      (j) => j.status === 'completed' && j.startedAt && j.completedAt,
    );
    const avgProcessingTime =
      completedJobs.length > 0
        ? completedJobs.reduce((sum, j) => {
            if (j.completedAt && j.startedAt) {
              const duration = j.completedAt.getTime() - j.startedAt.getTime();
              return sum + duration;
            }
            return sum;
          }, 0) /
          completedJobs.length /
          1000 // Convert to seconds
        : 0;

    // Get recent activity
    const recentJobs = jobs
      .filter((j) => j.startedAt)
      .sort((a, b) => {
        if (a.startedAt && b.startedAt) {
          return b.startedAt.getTime() - a.startedAt.getTime();
        }
        return 0;
      })
      .slice(0, 10)
      .map((job) => ({
        id: job.id,
        documentId: job.documentId,
        status: job.status,
        progress: job.progress,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      }));

    return NextResponse.json({
      success: true,
      stats: {
        queue: queueStats,
        documents: documentStats,
        documentsByJurisdiction,
        documentsByCodeType,
        vector: vectorStats,
        avgProcessingTimeSeconds: Math.round(avgProcessingTime),
        recentActivity: recentJobs,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 },
    );
  }
}
