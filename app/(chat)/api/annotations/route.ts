import { auth } from '@/app/(auth)/auth';
import {
  getAnnotationsByUserId,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  getAnnotationById,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

const createAnnotationSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  category: z.string().max(100).optional(),
});

const updateAnnotationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
  category: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/annotations - List user's annotations
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const annotations = await getAnnotationsByUserId(session.user.id);
    return Response.json(annotations);
  } catch (error) {
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// POST /api/annotations - Create new annotation
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const json = await request.json();
    const body = createAnnotationSchema.parse(json);

    const newAnnotation = await createAnnotation({
      userId: session.user.id,
      ...body,
    });

    return Response.json(newAnnotation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// PUT /api/annotations - Update annotation
export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const json = await request.json();
    const body = updateAnnotationSchema.parse(json);

    // Verify ownership
    const annotation = await getAnnotationById(body.id);
    if (!annotation || annotation.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const updatedAnnotation = await updateAnnotation(body);
    return Response.json(updatedAnnotation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// DELETE /api/annotations?id=xxx - Delete annotation
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    // Verify ownership
    const annotation = await getAnnotationById(id);
    if (!annotation || annotation.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    const deletedAnnotation = await deleteAnnotation(id);
    return Response.json(deletedAnnotation);
  } catch (error) {
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
