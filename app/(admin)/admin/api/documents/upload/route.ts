import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  databaseAdapter,
  storageAdapter,
} from '@/app/(admin)/admin/ingestion/_lib/adapters';
import { UploadRequest } from '@/app/(admin)/admin/ingestion/_lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFolder = formData.get('targetFolder') as string;
    const metadataStr = formData.get('metadata') as string;

    if (!file || !targetFolder) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Parse metadata if provided
    let metadata: UploadRequest['metadata'] = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 },
      );
    }

    // Generate document ID and storage path
    const documentId = uuidv4();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath =
      metadata.jurisdiction && metadata.codeType && metadata.year
        ? storageAdapter.getDocumentPath(
            metadata.jurisdiction,
            metadata.codeType,
            metadata.year,
            fileName,
          )
        : `${targetFolder}/${fileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const { key, url } = await storageAdapter.uploadFile(buffer, storagePath, {
      contentType: 'application/pdf',
      metadata: {
        documentId,
        originalName: file.name,
        ...metadata,
      },
    });

    // Create database record
    const documentRecord = await databaseAdapter.createDocument({
      name: file.name,
      path: storagePath,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      uploadedBy: 'admin', // TODO: Get from auth session
      status: 'pending',
      metadata: {
        ...metadata,
        s3Key: key,
        s3Url: url,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: documentRecord.id,
        name: documentRecord.name,
        path: documentRecord.path,
        size: documentRecord.size,
        status: documentRecord.status,
        url,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 },
    );
  }
}

// List documents endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    // Get documents from database
    const documents = await databaseAdapter.getDocumentsByPath(path);

    // Build file tree structure
    const fileTree = buildFileTree(documents);

    return NextResponse.json({
      success: true,
      files: fileTree,
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 },
    );
  }
}

// Helper function to build file tree
function buildFileTree(documents: any[]): any[] {
  const tree: any = {};

  documents.forEach((doc) => {
    const parts = doc.path.split('/');
    let current = tree;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        current[part] = {
          id: doc.id,
          name: part,
          type: 'file',
          path: doc.path,
          size: doc.size,
          uploadedAt: doc.uploadedAt,
          status: doc.status,
          documentId: doc.id,
          metadata: doc.metadata,
        };
      } else {
        // It's a folder
        if (!current[part]) {
          current[part] = {
            id: `folder-${part}`,
            name: part,
            type: 'folder',
            path: parts.slice(0, index + 1).join('/'),
            children: {},
          };
        }
        current = current[part].children || current[part];
      }
    });
  });

  // Convert to array format
  return Object.values(tree).map((item) =>
    item.type === 'folder'
      ? { ...item, children: Object.values(item.children || {}) }
      : item,
  );
}
