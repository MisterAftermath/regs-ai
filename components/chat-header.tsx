'use client';

import { ModelSelector } from '@/components/model-selector';
import { JurisdictionSelector } from '@/components/jurisdiction-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { memo } from 'react';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import type { Session } from 'next-auth';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
  selectedJurisdictionId,
  onJurisdictionChange,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  selectedJurisdictionId?: string;
  onJurisdictionChange?: (value: string) => void;
}) {
  // Check if we're using a jurisdiction-based model
  const isJurisdictionModel =
    selectedModelId === 'chat-model-building-code-chroma' ||
    selectedModelId === 'chat-model-chroma';

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 border-b-2 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <SidebarToggle />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin min-w-0 flex-1">
        {!isReadonly && (
          <ModelSelector
            session={session}
            selectedModelId={selectedModelId}
            className="flex-shrink-0"
          />
        )}

        {!isReadonly && isJurisdictionModel && onJurisdictionChange && (
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
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.selectedJurisdictionId === nextProps.selectedJurisdictionId
  );
});
