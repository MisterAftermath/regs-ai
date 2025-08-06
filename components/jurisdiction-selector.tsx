'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { jurisdictions } from '@/lib/ai/jurisdictions';
import { GlobeIcon, ChevronDownIcon, CheckCircleFillIcon } from './icons';
import { cn } from '@/lib/utils';

interface JurisdictionSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function JurisdictionSelector({
  value,
  onValueChange,
  className,
}: JurisdictionSelectorProps) {
  const [open, setOpen] = useState(false);

  // Get default jurisdiction
  const defaultJurisdiction = jurisdictions.find((j) => j.isDefault);
  const currentJurisdictionId = value || defaultJurisdiction?.id;

  // Get selected jurisdiction for display
  const selectedJurisdiction = jurisdictions.find(
    (j) => j.id === currentJurisdictionId,
  );

  // Group jurisdictions by state
  const jurisdictionsByState = jurisdictions.reduce(
    (acc, jurisdiction) => {
      const state = jurisdiction.state || 'Other';
      if (!acc[state]) {
        acc[state] = [];
      }
      acc[state].push(jurisdiction);
      return acc;
    },
    {} as Record<string, typeof jurisdictions>,
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          variant="outline"
          className="md:px-2 md:h-[34px] max-w-[140px] sm:max-w-none"
        >
          <GlobeIcon size={14} className="flex-shrink-0" />
          <span className="truncate">
            {selectedJurisdiction?.name || 'Select jurisdiction'}
          </span>
          <ChevronDownIcon className="flex-shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[200px] max-w-[300px] sm:min-w-[240px]"
      >
        {Object.entries(jurisdictionsByState).map(
          ([state, stateJurisdictions], index) => (
            <React.Fragment key={state}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {state}
              </DropdownMenuLabel>
              {stateJurisdictions.map((jurisdiction) => (
                <DropdownMenuItem
                  key={jurisdiction.id}
                  onSelect={() => {
                    setOpen(false);
                    onValueChange(jurisdiction.id);
                  }}
                  data-active={jurisdiction.id === currentJurisdictionId}
                  asChild
                >
                  <button
                    type="button"
                    className="gap-4 group/item flex flex-row justify-between items-center w-full"
                  >
                    <div className="text-sm">{jurisdiction.name}</div>
                    <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                      <CheckCircleFillIcon />
                    </div>
                  </button>
                </DropdownMenuItem>
              ))}
            </React.Fragment>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
