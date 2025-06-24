import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  databaseAdapter,
  storageAdapter,
} from '@/app/(admin)/admin/ingestion/_lib/adapters';

export const runtime = 'nodejs';

// Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const document = await databaseAdapter.getDocument(params.id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Get signed URL for preview
    const previewUrl = await storageAdapter.getFileUrl(
      document.metadata?.s3Key || document.path,
      3600, // 1 hour expiry
    );

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        previewUrl,
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 },
    );
  }
}

// Update document metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const updates = await request.json();
    const document = await databaseAdapter.getDocument(params.id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Update database record
    await databaseAdapter.updateDocumentStatus(params.id, updates.status);

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
    });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 },
    );
  }
}

// Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const document = await databaseAdapter.getDocument(params.id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Delete from S3
    await storageAdapter.deleteFile(document.metadata?.s3Key || document.path);

    // Delete from vector database
    const { vectorAdapter } = await import(
      '@/app/(admin)/admin/ingestion/_lib/adapters'
    );
    await vectorAdapter.deleteDocumentsByMetadata({ documentId: params.id });

    // Delete from database
    await databaseAdapter.deleteDocument(params.id);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 },
    );
  }
}
