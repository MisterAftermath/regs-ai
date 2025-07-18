import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { Annotation } from '@/lib/db/schema';
import { toast } from '@/components/toast';

export function useAnnotations() {
  const { data, error, mutate } = useSWR<Annotation[]>(
    '/api/annotations',
    fetcher,
  );

  const createAnnotation = async (annotation: {
    title: string;
    content: string;
    category?: string;
  }) => {
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      });

      if (!response.ok) throw new Error('Failed to create annotation');

      const newAnnotation = await response.json();
      await mutate();

      toast({
        type: 'success',
        description: 'Annotation created successfully',
      });

      return newAnnotation;
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to create annotation',
      });
      throw error;
    }
  };

  const updateAnnotation = async (annotation: {
    id: string;
    title?: string;
    content?: string;
    category?: string;
    isActive?: boolean;
  }) => {
    try {
      const response = await fetch('/api/annotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      });

      if (!response.ok) throw new Error('Failed to update annotation');

      const updatedAnnotation = await response.json();
      await mutate();

      toast({
        type: 'success',
        description: 'Annotation updated successfully',
      });

      return updatedAnnotation;
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to update annotation',
      });
      throw error;
    }
  };

  const deleteAnnotation = async (id: string) => {
    try {
      const response = await fetch(`/api/annotations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete annotation');

      await mutate();

      toast({
        type: 'success',
        description: 'Annotation deleted successfully',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to delete annotation',
      });
      throw error;
    }
  };

  const toggleAnnotation = async (id: string, isActive: boolean) => {
    try {
      await updateAnnotation({ id, isActive });
    } catch (error) {
      console.error('Failed to toggle annotation:', error);
    }
  };

  return {
    annotations: data || [],
    isLoading: !error && !data,
    isError: !!error,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    toggleAnnotation,
    mutate,
  };
}
