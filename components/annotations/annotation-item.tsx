'use client';

import type { Annotation } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  TrashIcon,
  PencilEditIcon,
} from '@/components/icons';
import { cn } from '@/lib/utils';

interface AnnotationItemProps {
  annotation: Annotation;
  onEdit: (annotation: Annotation) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export function AnnotationItem({
  annotation,
  onEdit,
  onDelete,
  onToggle,
}: AnnotationItemProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3 rounded-lg border bg-card',
        !annotation.isActive && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{annotation.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {annotation.content}
          </p>
          {annotation.category && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary rounded-md">
              {annotation.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch
            checked={annotation.isActive}
            onCheckedChange={(checked) => onToggle(annotation.id, checked)}
            aria-label="Toggle annotation"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontalIcon size={16} />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(annotation)}
                className="cursor-pointer"
              >
                <PencilEditIcon size={16} />
                <span className="ml-2">Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(annotation.id)}
                className="cursor-pointer text-destructive"
              >
                <TrashIcon size={16} />
                <span className="ml-2">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
