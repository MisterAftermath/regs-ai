'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusIcon } from '@/components/icons';
import { AnnotationItem } from './annotation-item';
import { AnnotationEditor } from './annotation-editor';
import { useAnnotations } from '@/hooks/use-annotations';
import { Skeleton } from '@/components/ui/skeleton';
import type { Annotation } from '@/lib/db/schema';

export function AnnotationsSection() {
  const {
    annotations,
    isLoading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    toggleAnnotation,
  } = useAnnotations();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingAnnotation(null);
    setEditorOpen(true);
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setEditorOpen(true);
  };

  const handleSave = async (data: {
    title: string;
    content: string;
    category?: string;
  }) => {
    if (editingAnnotation) {
      await updateAnnotation({
        id: editingAnnotation.id,
        ...data,
      });
    } else {
      await createAnnotation(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteAnnotation(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>
          <div className="flex items-center justify-between w-full">
            <span>Annotations</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCreate}
              className="h-6 w-6"
            >
              <PlusIcon size={14} />
              <span className="sr-only">Add annotation</span>
            </Button>
          </div>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading ? (
              <div className="space-y-2 px-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : annotations.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No annotations yet. Add custom context for the AI to consider.
              </div>
            ) : (
              <div className="space-y-2 px-2">
                {annotations.map((annotation) => (
                  <AnnotationItem
                    key={annotation.id}
                    annotation={annotation}
                    onEdit={handleEdit}
                    onDelete={setDeleteId}
                    onToggle={toggleAnnotation}
                  />
                ))}
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AnnotationEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        annotation={editingAnnotation}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete annotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The annotation will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
