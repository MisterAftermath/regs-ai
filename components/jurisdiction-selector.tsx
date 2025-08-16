'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Get default jurisdiction
  const defaultJurisdiction = jurisdictions.find((j) => j.isDefault);
  const currentJurisdictionId = value || defaultJurisdiction?.id;

  // Get selected jurisdiction for display
  const selectedJurisdiction = jurisdictions.find(
    (j) => j.id === currentJurisdictionId,
  );

  // Filter jurisdictions based on search query
  const filteredJurisdictions = useMemo(() => {
    if (!searchQuery.trim()) return jurisdictions;

    const query = searchQuery.toLowerCase();
    return jurisdictions.filter((j) => j.name.toLowerCase().includes(query));
  }, [searchQuery]);

  // Separate filtered jurisdictions into cities and counties
  const { cities, counties } = useMemo(() => {
    const cities: typeof jurisdictions = [];
    const counties: typeof jurisdictions = [];

    filteredJurisdictions.forEach((j) => {
      if (j.name.includes('County')) {
        counties.push(j);
      } else {
        cities.push(j);
      }
    });

    // Sort alphabetically
    cities.sort((a, b) => a.name.localeCompare(b.name));
    counties.sort((a, b) => a.name.localeCompare(b.name));

    return { cities, counties };
  }, [filteredJurisdictions]);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        // Reset search when closing
        if (!newOpen) {
          setSearchQuery('');
        }
      }}
    >
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          variant="outline"
          className="md:px-2 md:h-[34px] max-w-[180px] sm:max-w-none"
        >
          <span className="shrink-0">
            <GlobeIcon size={14} />
          </span>
          <span className="truncate">
            {selectedJurisdiction?.name || 'Select jurisdiction'}
          </span>
          <span className="shrink-0 ml-1">
            <ChevronDownIcon />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[320px] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside if search has value
          if (searchQuery.trim()) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if search has value
          if (searchQuery.trim()) {
            e.preventDefault();
          }
        }}
      >
        {/* Search input */}
        <div className="p-2 border-b">
          <Input
            placeholder="Search jurisdictions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full"
            autoFocus
            onKeyDown={(e) => {
              // Prevent dropdown keyboard navigation while typing
              e.stopPropagation();

              // Allow Enter key to select first filtered result
              if (e.key === 'Enter' && filteredJurisdictions.length > 0) {
                e.preventDefault();
                const firstResult = cities.length > 0 ? cities[0] : counties[0];
                if (firstResult) {
                  onValueChange(firstResult.id);
                  setOpen(false);
                }
              }
            }}
          />
        </div>

        {/* Scrollable content area */}
        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent relative">
          {/* No results message */}
          {filteredJurisdictions.length === 0 && (
            <div className="p-8 text-center">
              <div className="mb-2 text-muted-foreground flex justify-center opacity-20">
                <GlobeIcon size={32} />
              </div>
              <p className="text-sm text-muted-foreground">
                No jurisdictions found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          )}

          {/* Cities section */}
          {cities.length > 0 && (
            <>
              <div className="sticky top-0 z-10 bg-background">
                <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-b">
                  CITIES ({cities.length})
                </DropdownMenuLabel>
              </div>
              <div className="px-1">
                {cities.map((jurisdiction) => (
                  <DropdownMenuItem
                    key={jurisdiction.id}
                    onSelect={() => {
                      onValueChange(jurisdiction.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-sm p-2 my-0.5 hover:bg-accent/50 focus:bg-accent"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={cn(
                          'text-sm',
                          jurisdiction.id === currentJurisdictionId &&
                            'font-medium',
                        )}
                      >
                        {jurisdiction.name}
                      </span>
                      {jurisdiction.id === currentJurisdictionId && (
                        <div className="size-4 text-primary">
                          <CheckCircleFillIcon size={16} />
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}

          {/* Counties section */}
          {counties.length > 0 && (
            <>
              {cities.length > 0 && <div className="h-2" />}
              <div className="sticky top-0 z-10 bg-background">
                <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-b">
                  COUNTIES ({counties.length})
                </DropdownMenuLabel>
              </div>
              <div className="px-1">
                {counties.map((jurisdiction) => (
                  <DropdownMenuItem
                    key={jurisdiction.id}
                    onSelect={() => {
                      onValueChange(jurisdiction.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-sm p-2 my-0.5 hover:bg-accent/50 focus:bg-accent"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={cn(
                          'text-sm',
                          jurisdiction.id === currentJurisdictionId &&
                            'font-medium',
                        )}
                      >
                        {jurisdiction.name}
                      </span>
                      {jurisdiction.id === currentJurisdictionId && (
                        <div className="size-4 text-primary">
                          <CheckCircleFillIcon size={16} />
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
