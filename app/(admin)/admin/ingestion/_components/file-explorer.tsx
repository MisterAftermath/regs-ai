'use client';

import { useState } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  FileText,
  MoreVertical,
  Download,
  Trash2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
  uploadedAt?: Date;
  status?: 'pending' | 'processing' | 'completed' | 'error';
}

// Mock data - replace with actual API calls
const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: 'California Building Code',
    type: 'folder',
    children: [
      {
        id: '1-1',
        name: '2022 Edition',
        type: 'folder',
        children: [
          {
            id: '1-1-1',
            name: 'Chapter 1 - Administration.pdf',
            type: 'file',
            size: 2048000,
            uploadedAt: new Date('2024-01-15'),
            status: 'completed',
          },
          {
            id: '1-1-2',
            name: 'Chapter 2 - Definitions.pdf',
            type: 'file',
            size: 1536000,
            uploadedAt: new Date('2024-01-15'),
            status: 'processing',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'International Building Code',
    type: 'folder',
    children: [],
  },
];

export function FileExplorer() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedItem === node.id;

    return (
      <div key={node.id}>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-md cursor-pointer',
            isSelected && 'bg-accent',
            depth > 0 && 'ml-6',
          )}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            }
            setSelectedItem(node.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (node.type === 'folder') {
                toggleFolder(node.id);
              }
              setSelectedItem(node.id);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4 text-blue-600" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <FileText className="h-4 w-4 text-gray-600" />
            </>
          )}

          <span className="flex-1 text-sm">{node.name}</span>

          {node.type === 'file' && (
            <>
              <span className={cn('text-xs', getStatusColor(node.status))}>
                {node.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {node.size && formatFileSize(node.size)}
              </span>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {node.type === 'file' && (
                <>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Document Library</h2>
        <Button variant="outline" size="sm">
          <Folder className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </div>

      <div className="border rounded-lg p-4">
        {mockFileTree.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No documents uploaded yet
          </p>
        ) : (
          <div className="space-y-1">
            {mockFileTree.map((node) => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}
