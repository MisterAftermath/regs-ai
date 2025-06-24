'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  targetFolder?: string;
}

export function UploadZone() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [targetFolder, setTargetFolder] = useState<string>('root');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending' as const,
        targetFolder,
      }));
      setFiles((prev) => [...prev, ...newFiles]);

      // Simulate upload - replace with actual upload logic
      newFiles.forEach((uploadFile) => {
        simulateUpload(uploadFile.id);
      });
    },
    [targetFolder],
  );

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress,
                status: progress === 100 ? 'completed' : 'uploading',
              }
            : f,
        ),
      );
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upload Documents</h2>
        <Select value={targetFolder} onValueChange={setTargetFolder}>
          <SelectTrigger className="w-[250px]">
            <Folder className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select target folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="root">Root Directory</SelectItem>
            <SelectItem value="california">California Building Code</SelectItem>
            <SelectItem value="international">
              International Building Code
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25',
          'hover:border-primary hover:bg-primary/5',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop the PDFs here...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Drag & drop PDF files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Only PDF files are accepted
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Upload Queue</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <FileText className="h-8 w-8 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {file.file.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatFileSize(file.file.size)}</span>
                    <span
                      className={cn(
                        file.status === 'completed' && 'text-green-600',
                        file.status === 'error' && 'text-red-600',
                      )}
                    >
                      {file.status}
                    </span>
                  </div>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="mt-2" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFiles([])}>
              Clear All
            </Button>
            <Button>Process Documents</Button>
          </div>
        </div>
      )}
    </div>
  );
}
