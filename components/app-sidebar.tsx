'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PlusIcon, ChevronUpIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { AnnotationsSection } from '@/components/annotations/annotations-section';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  // State for annotations panel
  const [isAnnotationsCollapsed, setIsAnnotationsCollapsed] = useState(false);
  const [annotationsPanelSize, setAnnotationsPanelSize] = useState(35);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-layout');
    if (saved) {
      try {
        const { annotationsCollapsed, annotationsSize } = JSON.parse(saved);
        setIsAnnotationsCollapsed(annotationsCollapsed ?? false);
        setAnnotationsPanelSize(annotationsSize ?? 35);
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem(
      'sidebar-layout',
      JSON.stringify({
        annotationsCollapsed: isAnnotationsCollapsed,
        annotationsSize: annotationsPanelSize,
      }),
    );
  }, [isAnnotationsCollapsed, annotationsPanelSize]);

  const toggleAnnotations = () => {
    setIsAnnotationsCollapsed(!isAnnotationsCollapsed);
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 bg-primary dark:bg-inherit text-primary-foreground dark:text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90 rounded-md cursor-pointer">
                Regs AI
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col p-0 gap-0">
        {user ? (
          <PanelGroup direction="vertical" className="flex-1">
            {/* Chat history panel */}
            <Panel
              defaultSize={
                isAnnotationsCollapsed ? 100 : 100 - annotationsPanelSize
              }
              minSize={20}
              className="flex flex-col"
            >
              <div className="flex-1 min-h-0 overflow-y-auto">
                <SidebarHistory user={user} />
              </div>
            </Panel>

            {/* Resize handle */}
            {!isAnnotationsCollapsed && (
              <PanelResizeHandle className="h-1 bg-border hover:bg-accent transition-colors cursor-row-resize group">
                <div className="size-full flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-muted-foreground rounded group-hover:bg-foreground transition-colors" />
                </div>
              </PanelResizeHandle>
            )}

            {/* Annotations panel */}
            <AnimatePresence initial={false}>
              {!isAnnotationsCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut',
                    height: { duration: 0.3 },
                    opacity: { duration: 0.2 },
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <Panel
                    defaultSize={annotationsPanelSize}
                    minSize={15}
                    maxSize={60}
                    onResize={(size) => setAnnotationsPanelSize(size)}
                    className="flex flex-col"
                  >
                    <div className="flex-1 min-h-0">
                      <AnnotationsSection
                        onToggleCollapse={toggleAnnotations}
                        isCollapsed={isAnnotationsCollapsed}
                      />
                    </div>
                  </Panel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed annotations header */}
            <AnimatePresence initial={false}>
              {isAnnotationsCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut',
                    height: { duration: 0.3 },
                    opacity: { duration: 0.2 },
                  }}
                  style={{ overflow: 'hidden' }}
                  className="border-t bg-muted/20"
                >
                  <div className="sticky top-0 bg-sidebar z-10 px-2 py-2 text-xs font-medium text-sidebar-foreground/70">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleAnnotations}
                          className="size-6 p-0"
                          title="Expand annotations"
                        >
                          <ChevronUpIcon size={14} />
                        </Button>
                        <span>Annotations</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </PanelGroup>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SidebarHistory user={user} />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
