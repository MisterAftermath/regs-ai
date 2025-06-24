import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { databaseAdapter } from '@/app/(admin)/admin/ingestion/_lib/adapters';

export const runtime = 'nodejs';

// Get job status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const job = await databaseAdapter.getProcessingJob(params.id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get document name
    const document = await databaseAdapter.getDocument(job.documentId);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        chunksProcessed: job.chunksProcessed,
        totalChunks: job.totalChunks,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        documentName: document?.name || 'Unknown',
        metadata: {
          pagesProcessed: job.chunksProcessed,
          totalPages: job.totalChunks,
          config: job.config,
        },
      },
    });
  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve job status' },
      { status: 500 },
    );
  }
}

// Update job (pause/resume)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { action } = await request.json();
    const job = await databaseAdapter.getProcessingJob(params.id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    switch (action) {
      case 'pause':
        if (job.status === 'processing') {
          await databaseAdapter.updateProcessingJob(params.id, {
            status: 'paused',
          });
        }
        break;

      case 'resume':
        if (job.status === 'paused') {
          await databaseAdapter.updateProcessingJob(params.id, {
            status: 'processing',
          });
          // TODO: Resume actual processing
        }
        break;

      case 'retry':
        if (job.status === 'error') {
          await databaseAdapter.updateProcessingJob(params.id, {
            status: 'queued',
            error: undefined,
          });
          // TODO: Restart processing
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Job ${action} successful`,
    });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 },
    );
  }
}
