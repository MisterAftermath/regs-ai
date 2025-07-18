# Annotations System Documentation

## Overview

The Annotations system allows users to add custom context, rules, or information that the AI will consider in every chat interaction. This feature enables users to personalize their AI experience by providing domain-specific knowledge, company policies, personal preferences, or any other contextual information that should be consistently applied.

## How It Works

1. **User Creates Annotations**: Users can create annotations through the sidebar UI, providing a title and content (up to 1000 characters).

2. **Annotations Are Stored**: Each annotation is stored in the database with an `isActive` flag, allowing users to toggle annotations on/off without deleting them.

3. **Active Annotations Are Fetched**: When a user sends a message, the system fetches all active annotations for that user.

4. **Annotations Are Added to System Prompt**: Active annotations are formatted and appended to the AI's system prompt, ensuring the AI considers this context for every response.

5. **AI Responds with Context**: The AI generates responses taking into account the user's custom annotations along with the regular system prompt.

## Technical Architecture

### Database Schema

**Table: `Annotation`**

- `id` (UUID): Primary key
- `userId` (UUID): Foreign key to User table
- `title` (TEXT): Title of the annotation
- `content` (TEXT): Content of the annotation (max 1000 chars enforced in UI)
- `category` (VARCHAR 100): Optional category for organization
- `isActive` (BOOLEAN): Whether the annotation is currently active
- `createdAt` (TIMESTAMP): Creation timestamp
- `updatedAt` (TIMESTAMP): Last update timestamp

**Indexes:**

- `idx_annotation_user`: Index on userId for efficient user queries
- `idx_annotation_active`: Composite index on (userId, isActive) for fetching active annotations

### API Endpoints

**Base URL**: `/api/annotations`

- **GET** `/api/annotations` - List all annotations for the authenticated user
- **POST** `/api/annotations` - Create a new annotation
  - Body: `{ title: string, content: string, category?: string }`
- **PUT** `/api/annotations` - Update an existing annotation
  - Body: `{ id: string, title?: string, content?: string, category?: string, isActive?: boolean }`
- **DELETE** `/api/annotations?id=xxx` - Delete an annotation

### Frontend Components

1. **AnnotationsSection** - Main container component displayed in the sidebar
2. **AnnotationItem** - Individual annotation display with toggle/edit/delete actions
3. **AnnotationEditor** - Dialog component for creating/editing annotations

## Files Affected

### Backend Files

1. **Database & Queries**

   - `lib/db/schema.ts` - Defines the Annotation table schema
   - `lib/db/queries.ts` - Contains all annotation-related database queries
   - `lib/db/migrations/0007_annotations.sql` - Migration file to create the table
   - `lib/db/migrations/meta/_journal.json` - Migration journal entry
   - `lib/db/migrations/meta/0007_snapshot.json` - Migration snapshot

2. **API Routes**

   - `app/(chat)/api/annotations/route.ts` - REST API endpoints for CRUD operations

3. **AI Integration**
   - `lib/ai/prompts.ts` - Modified to accept and format user annotations in system prompt
   - `app/(chat)/api/chat/route.ts` - Modified to fetch active annotations and pass to system prompt

### Frontend Files

1. **Components**

   - `components/annotations/annotations-section.tsx` - Main annotations UI component
   - `components/annotations/annotation-item.tsx` - Individual annotation display
   - `components/annotations/annotation-editor.tsx` - Create/edit dialog
   - `components/app-sidebar.tsx` - Modified to include AnnotationsSection

2. **Hooks**
   - `hooks/use-annotations.ts` - Custom hook for annotation state management and API calls

## Usage Example

### Creating an Annotation

```typescript
// Using the useAnnotations hook
const { createAnnotation } = useAnnotations();

await createAnnotation({
  title: "Company Name",
  content: "Our company is called TechCorp and we specialize in AI solutions",
  category: "company-info",
});
```

### System Prompt Integration

When a user sends a message, their active annotations are formatted as:

```
User Context and Rules:
- Company Name: Our company is called TechCorp and we specialize in AI solutions
- Measurement Units: Always use metric units in responses
- Communication Style: Be concise and professional in all responses
```

## Extending the Feature

### Adding Search/Filter

To add search functionality:

1. Add a search input to `AnnotationsSection`
2. Filter the annotations array based on search term
3. Consider adding database-level search for large annotation sets

### Adding Templates

To add annotation templates:

1. Create a templates configuration file
2. Add a template selector to the `AnnotationEditor`
3. Pre-fill form fields based on selected template

### Increasing Character Limit

To increase the character limit:

1. Update the validation in `app/(chat)/api/annotations/route.ts`
2. Update the maxLength prop in `components/annotations/annotation-editor.tsx`
3. Consider pagination for the annotations list if allowing very long annotations

### Adding Import/Export

To add import/export functionality:

1. Create new API endpoints for bulk operations
2. Add import/export buttons to the UI
3. Support common formats (JSON, CSV)

## Security Considerations

1. **User Isolation**: Annotations are strictly isolated by userId - users can only access their own annotations
2. **Input Validation**: All inputs are validated for length and content
3. **SQL Injection Protection**: Using parameterized queries via Drizzle ORM
4. **XSS Protection**: React automatically escapes content, preventing XSS attacks

## Performance Considerations

1. **Indexing**: Database indexes ensure fast queries even with many annotations
2. **Caching**: SWR provides client-side caching and revalidation
3. **Lazy Loading**: Annotations are only fetched when the sidebar is opened
4. **Character Limit**: 1000 character limit prevents overly large prompts

## Future Enhancements

1. **Categories/Tags**: Enhance the category system with predefined categories and filtering
2. **Sharing**: Allow users to share annotation sets with team members
3. **Version History**: Track changes to annotations over time
4. **Rich Text**: Support markdown or rich text formatting in annotations
5. **AI Suggestions**: Use AI to suggest relevant annotations based on chat context
6. **Vector Database Integration**: For users with hundreds of annotations, integrate with vector DB for semantic search
