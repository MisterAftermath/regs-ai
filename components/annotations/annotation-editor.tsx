'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Annotation } from '@/lib/db/schema';

interface AnnotationEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annotation?: Annotation | null;
  onSave: (annotation: {
    title: string;
    content: string;
    category?: string;
  }) => Promise<void>;
}

export function AnnotationEditor({
  open,
  onOpenChange,
  annotation,
  onSave,
}: AnnotationEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (annotation) {
      setTitle(annotation.title);
      setContent(annotation.content);
      setCategory(annotation.category || '');
    } else {
      setTitle('');
      setContent('');
      setCategory('');
    }
  }, [annotation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save annotation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {annotation ? 'Edit Annotation' : 'Create Annotation'}
            </DialogTitle>
            <DialogDescription>
              Add custom context that will be included with every message to the
              AI.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Company policies"
                maxLength={100}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g., Always prioritize safety over efficiency..."
                rows={4}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/1000
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., policies, definitions, rules"
                maxLength={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : annotation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
