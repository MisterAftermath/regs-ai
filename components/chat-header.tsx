'use client';

import { JurisdictionSelector } from '@/components/jurisdiction-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { memo } from 'react';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  selectedJurisdictionId,
  onJurisdictionChange,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  selectedJurisdictionId?: string;
  onJurisdictionChange?: (value: string) => void;
}) {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 border-b-2 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <SidebarToggle />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin min-w-0 flex-1">
        {!isReadonly && onJurisdictionChange && (
          <JurisdictionSelector
            value={selectedJurisdictionId}
            onValueChange={onJurisdictionChange}
            className="flex-shrink-0"
          />
        )}

        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            className="flex-shrink-0"
          />
        )}
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.selectedJurisdictionId === nextProps.selectedJurisdictionId
  );
});
