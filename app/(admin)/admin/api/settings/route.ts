import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { databaseAdapter } from '@/app/(admin)/admin/ingestion/_lib/adapters';

export const runtime = 'nodejs';

// Get current ingestion settings
export async function GET(request: NextRequest) {
  try {
    const config = await databaseAdapter.getIngestionConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 },
    );
  }
}

// Update ingestion settings
export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // Validate configuration
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          validationErrors,
        },
        { status: 400 },
      );
    }

    await databaseAdapter.saveIngestionConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 },
    );
  }
}

function validateConfig(config: any): string[] {
  const errors: string[] = [];

  // Validate chunking strategy
  if (!['section', 'fixed', 'hybrid'].includes(config.chunkingStrategy)) {
    errors.push('Invalid chunking strategy');
  }

  // Validate chunk size
  if (config.maxChunkSize < 100 || config.maxChunkSize > 2000) {
    errors.push('Chunk size must be between 100 and 2000 tokens');
  }

  // Validate overlap percentage
  if (config.overlapPercentage < 0 || config.overlapPercentage > 50) {
    errors.push('Overlap percentage must be between 0 and 50');
  }

  // Validate language
  const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja'];
  if (!supportedLanguages.includes(config.language)) {
    errors.push('Unsupported language');
  }

  return errors;
}
