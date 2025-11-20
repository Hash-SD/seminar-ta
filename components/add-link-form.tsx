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
  const [scheduleType, setScheduleType] = useState('proposal'); // 'proposal' | 'hasil'
  const [department, setDepartment] = useState(''); // e.g. 'Teknik Informatika'

  // Column Mapping State
  const [colNama, setColNama] = useState('');
  const [labelNama, setLabelNama] = useState('');

  const [colJudul, setColJudul] = useState('');
  const [labelJudul, setLabelJudul] = useState('');

  const [colTanggal, setColTanggal] = useState('');
  const [labelTanggal, setLabelTanggal] = useState('');

  const [colJam, setColJam] = useState('');
  const [labelJam, setLabelJam] = useState('');

  const [colRuangan, setColRuangan] = useState('');
  const [labelRuangan, setLabelRuangan] = useState('');

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
             type: scheduleType,
             department: department,
             columns: {
                Nama: { cell: colNama, label: labelNama },
                Judul: { cell: colJudul, label: labelJudul },
                Tanggal: { cell: colTanggal, label: labelTanggal },
                Jam: { cell: colJam, label: labelJam },
                Ruangan: { cell: colRuangan, label: labelRuangan }
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
      setDepartment('');
      setColNama(''); setLabelNama('');
      setColJudul(''); setLabelJudul('');
      setColTanggal(''); setLabelTanggal('');
      setColJam(''); setLabelJam('');
      setColRuangan(''); setLabelRuangan('');
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
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="mb-1">Seminar Type</Label>
                    <Select value={scheduleType} onValueChange={setScheduleType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="proposal">Seminar Proposal</SelectItem>
                            <SelectItem value="hasil">Seminar Hasil</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="mb-1">Program Studi / Jurusan</Label>
                    <Input
                        type="text"
                        placeholder="e.g. Teknik Informatika"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
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
                </div>
            )}
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Column Mapping (Excel Coordinates)</h3>
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <Label>Cell for "Nama"</Label>
                        <Input placeholder="e.g. A1" value={colNama} onChange={(e) => setColNama(e.target.value)} required />
                     </div>
                     <div className="space-y-1">
                        <Label>Custom Label</Label>
                        <Input placeholder="e.g. Mahasiswa" value={labelNama} onChange={(e) => setLabelNama(e.target.value)} />
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <Label>Cell for "Judul"</Label>
                        <Input placeholder="e.g. B1" value={colJudul} onChange={(e) => setColJudul(e.target.value)} required />
                     </div>
                     <div className="space-y-1">
                        <Label>Custom Label</Label>
                        <Input placeholder="e.g. Topik TA" value={labelJudul} onChange={(e) => setLabelJudul(e.target.value)} />
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <Label>Cell for "Tanggal"</Label>
                        <Input placeholder="e.g. C1" value={colTanggal} onChange={(e) => setColTanggal(e.target.value)} required />
                     </div>
                     <div className="space-y-1">
                        <Label>Custom Label</Label>
                        <Input placeholder="e.g. Jadwal" value={labelTanggal} onChange={(e) => setLabelTanggal(e.target.value)} />
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <Label>Cell for "Jam"</Label>
                        <Input placeholder="e.g. D1" value={colJam} onChange={(e) => setColJam(e.target.value)} required />
                     </div>
                     <div className="space-y-1">
                        <Label>Custom Label</Label>
                        <Input placeholder="e.g. Waktu" value={labelJam} onChange={(e) => setLabelJam(e.target.value)} />
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <Label>Cell for "Ruangan"</Label>
                        <Input placeholder="e.g. E1" value={colRuangan} onChange={(e) => setColRuangan(e.target.value)} required />
                     </div>
                     <div className="space-y-1">
                        <Label>Custom Label</Label>
                        <Input placeholder="e.g. Lokasi" value={labelRuangan} onChange={(e) => setLabelRuangan(e.target.value)} />
                     </div>
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
