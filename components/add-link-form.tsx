'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface AddLinkFormProps {
  onSuccess?: () => void;
}

export default function AddLinkForm({ onSuccess }: AddLinkFormProps) {
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [headerRow, setHeaderRow] = useState('1');

  // Column Mapping State (Now storing Letters e.g., A, B)
  const [colNama, setColNama] = useState('');
  const [colJudul, setColJudul] = useState('');
  const [colTanggal, setColTanggal] = useState('');
  const [colJam, setColJam] = useState('');
  const [colRuangan, setColRuangan] = useState('');

  // Auto Refresh State
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('60');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_url: sheetUrl,
          sheet_name: sheetName,
          configuration: {
             header_row: parseInt(headerRow) || 1,
             columns: {
                Nama: colNama,
                Judul: colJudul,
                Tanggal: colTanggal,
                Jam: colJam,
                Ruangan: colRuangan
             },
             auto_refresh: autoRefresh,
             refresh_interval: parseInt(refreshInterval)
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      toast({
        title: 'Success',
        description: 'Spreadsheet link added successfully',
      });

      // Reset form
      setSheetUrl('');
      setSheetName('');
      setHeaderRow('1');
      setColNama('');
      setColJudul('');
      setColTanggal('');
      setColJam('');
      setColRuangan('');
      setAutoRefresh(false);
      setRefreshInterval('60');

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Spreadsheet</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">General Info</h3>
            <div>
              <Label className="mb-1">Google Sheets URL</Label>
              <Input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Make sure the Google Service Account email is added as Editor/Viewer
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="mb-1">Sheet Tab Name</Label>
                    <Input
                        type="text"
                        placeholder="e.g., Sheet1"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Label className="mb-1">Header Row Number</Label>
                    <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={headerRow}
                        onChange={(e) => setHeaderRow(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                 <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                 <Label htmlFor="auto-refresh">Customize Cache Duration</Label>
            </div>

            {autoRefresh && (
                <div>
                    <Label className="mb-1">Cache Duration (Minutes)</Label>
                    <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 Minutes</SelectItem>
                            <SelectItem value="15">15 Minutes</SelectItem>
                            <SelectItem value="30">30 Minutes</SelectItem>
                            <SelectItem value="60">1 Hour</SelectItem>
                            <SelectItem value="180">3 Hours</SelectItem>
                            <SelectItem value="360">6 Hours</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                        Data will be cached for this duration before fetching from Google Sheets again.
                    </p>
                </div>
            )}
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Column Mapping (Excel Format)</h3>
            <p className="text-sm text-muted-foreground">
                Enter the Column Letter (e.g., A, B, C) for each attribute.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label>Column for "Nama"</Label>
                    <Input
                        placeholder="e.g. A"
                        value={colNama}
                        onChange={(e) => setColNama(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Label>Column for "Judul"</Label>
                    <Input
                        placeholder="e.g. B"
                        value={colJudul}
                        onChange={(e) => setColJudul(e.target.value)}
                        required
                    />
                </div>
                 <div>
                    <Label>Column for "Tanggal"</Label>
                    <Input
                        placeholder="e.g. C"
                        value={colTanggal}
                        onChange={(e) => setColTanggal(e.target.value)}
                        required
                    />
                </div>
                 <div>
                    <Label>Column for "Jam"</Label>
                    <Input
                        placeholder="e.g. D"
                        value={colJam}
                        onChange={(e) => setColJam(e.target.value)}
                        required
                    />
                </div>
                 <div>
                    <Label>Column for "Ruangan"</Label>
                    <Input
                        placeholder="e.g. E"
                        value={colRuangan}
                        onChange={(e) => setColRuangan(e.target.value)}
                        required
                    />
                </div>
            </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Adding...' : 'Add Spreadsheet'}
        </Button>
      </form>
    </Card>
  );
}
