'use client';

import { useState } from 'react';
import { FileExplorer } from './_components/file-explorer';
import { UploadZone } from './_components/upload-zone';
import { ProcessingQueue } from './_components/processing-queue';
import { IngestionSettings } from './_components/ingestion-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IngestionDashboard() {
  const [activeTab, setActiveTab] = useState('documents');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Ingestion</h1>
        <p className="text-muted-foreground">
          Upload and process building code PDFs for the knowledge base
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="processing">Processing Queue</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <FileExplorer />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <UploadZone />
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <ProcessingQueue />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <IngestionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
