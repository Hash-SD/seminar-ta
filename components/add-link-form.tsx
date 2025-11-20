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

  // Column Mapping State
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

            <div>
              <Label className="mb-1">Sheet Tab Name</Label>
              <Input
                type="text"
                placeholder="e.g., Sheet1"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                required
              />
               <p className="text-xs text-muted-foreground mt-1">
                Can be a single name (e.g., "Sheet1") or multiple separated by comma (e.g., "Sheet1,Sheet2")
              </p>
            </div>

            <div className="flex items-center space-x-2">
                 <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                 <Label htmlFor="auto-refresh">Enable Automatic Scheduled Refresh</Label>
            </div>

            {autoRefresh && (
                <div>
                    <Label className="mb-1">Refresh Interval (Minutes)</Label>
                    <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">Every 15 Minutes</SelectItem>
                            <SelectItem value="30">Every 30 Minutes</SelectItem>
                            <SelectItem value="60">Every 1 Hour</SelectItem>
                            <SelectItem value="180">Every 3 Hours</SelectItem>
                            <SelectItem value="360">Every 6 Hours</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                        System will automatically fetch new data at this interval.
                    </p>
                </div>
            )}
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Column Mapping</h3>
            <p className="text-sm text-muted-foreground">
                Enter the exact header name in your spreadsheet for each attribute.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Header for "Nama"</Label>
                    <Input
                        placeholder="e.g. Nama Mahasiswa"
                        value={colNama}
                        onChange={(e) => setColNama(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Label>Header for "Judul"</Label>
                    <Input
                        placeholder="e.g. Judul TA"
                        value={colJudul}
                        onChange={(e) => setColJudul(e.target.value)}
                        required
                    />
                </div>
                 <div>
                    <Label>Header for "Tanggal"</Label>
                    <Input
                        placeholder="e.g. Tanggal Seminar"
                        value={colTanggal}
                        onChange={(e) => setColTanggal(e.target.value)}
                        required
                    />
                </div>
                 <div>
                    <Label>Header for "Jam"</Label>
                    <Input
                        placeholder="e.g. Waktu"
                        value={colJam}
                        onChange={(e) => setColJam(e.target.value)}
                        required
                    />
                </div>
                 <div>
                    <Label>Header for "Ruangan"</Label>
                    <Input
                        placeholder="e.g. Lokasi"
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
