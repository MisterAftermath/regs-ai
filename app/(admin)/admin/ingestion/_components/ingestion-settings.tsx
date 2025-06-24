'use client';

import { useState } from 'react';
import { Save, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface IngestionConfig {
  chunkingStrategy: 'section' | 'fixed' | 'hybrid';
  maxChunkSize: number;
  overlapPercentage: number;
  extractTables: boolean;
  extractImages: boolean;
  preserveFormatting: boolean;
  ocrEnabled: boolean;
  language: string;
}

export function IngestionSettings() {
  const [config, setConfig] = useState<IngestionConfig>({
    chunkingStrategy: 'section',
    maxChunkSize: 1000,
    overlapPercentage: 10,
    extractTables: true,
    extractImages: false,
    preserveFormatting: true,
    ocrEnabled: true,
    language: 'en',
  });

  const updateConfig = <K extends keyof IngestionConfig>(
    key: K,
    value: IngestionConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ingestion Settings</h2>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chunking Configuration</CardTitle>
            <CardDescription>
              Configure how documents are split into chunks for processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chunking-strategy">Chunking Strategy</Label>
              <Select
                value={config.chunkingStrategy}
                onValueChange={(value: IngestionConfig['chunkingStrategy']) =>
                  updateConfig('chunkingStrategy', value)
                }
              >
                <SelectTrigger id="chunking-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="section">
                    <div>
                      <div className="font-medium">By Section</div>
                      <div className="text-xs text-muted-foreground">
                        Split by document structure (headings, sections)
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div>
                      <div className="font-medium">Fixed Size</div>
                      <div className="text-xs text-muted-foreground">
                        Split into equal-sized chunks
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div>
                      <div className="font-medium">Hybrid</div>
                      <div className="text-xs text-muted-foreground">
                        Combine section and size limits
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="chunk-size">Maximum Chunk Size</Label>
                <span className="text-sm text-muted-foreground">
                  {config.maxChunkSize} tokens
                </span>
              </div>
              <Slider
                id="chunk-size"
                min={100}
                max={2000}
                step={100}
                value={[config.maxChunkSize]}
                onValueChange={([value]) => updateConfig('maxChunkSize', value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100</span>
                <span>2000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="overlap">Chunk Overlap</Label>
                <span className="text-sm text-muted-foreground">
                  {config.overlapPercentage}%
                </span>
              </div>
              <Slider
                id="overlap"
                min={0}
                max={50}
                step={5}
                value={[config.overlapPercentage]}
                onValueChange={([value]) =>
                  updateConfig('overlapPercentage', value)
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Overlap helps maintain context between chunks, improving
                  retrieval quality but increasing storage requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extraction Options</CardTitle>
            <CardDescription>
              Configure what content to extract from documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="extract-tables">Extract Tables</Label>
                <p className="text-sm text-muted-foreground">
                  Preserve table structure and data
                </p>
              </div>
              <Switch
                id="extract-tables"
                checked={config.extractTables}
                onCheckedChange={(checked) =>
                  updateConfig('extractTables', checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="extract-images">Extract Images</Label>
                <p className="text-sm text-muted-foreground">
                  Extract and process diagrams and figures
                </p>
              </div>
              <Switch
                id="extract-images"
                checked={config.extractImages}
                onCheckedChange={(checked) =>
                  updateConfig('extractImages', checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="preserve-formatting">Preserve Formatting</Label>
                <p className="text-sm text-muted-foreground">
                  Maintain original text formatting and structure
                </p>
              </div>
              <Switch
                id="preserve-formatting"
                checked={config.preserveFormatting}
                onCheckedChange={(checked) =>
                  updateConfig('preserveFormatting', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OCR Settings</CardTitle>
            <CardDescription>
              Configure optical character recognition for scanned documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ocr-enabled">Enable OCR</Label>
                <p className="text-sm text-muted-foreground">
                  Process scanned PDFs and images
                </p>
              </div>
              <Switch
                id="ocr-enabled"
                checked={config.ocrEnabled}
                onCheckedChange={(checked) =>
                  updateConfig('ocrEnabled', checked)
                }
              />
            </div>

            {config.ocrEnabled && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="language">Document Language</Label>
                  <Select
                    value={config.language}
                    onValueChange={(value) => updateConfig('language', value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
