'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface AddLinkFormProps {
  onSuccess?: () => void;
}

export default function AddLinkForm({ onSuccess }: AddLinkFormProps) {
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('');

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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      toast({
        title: 'Success',
        description: 'Spreadsheet link added successfully',
      });

      setSheetUrl('');
      setSheetName('');
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Google Sheets URL</label>
          <Input
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Copy the full URL from your Google Sheets
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sheet Name</label>
          <Input
            type="text"
            placeholder="e.g., Sheet1, Data, Daily Report"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            The name of the sheet tab to read from
          </p>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Adding...' : 'Add Spreadsheet'}
        </Button>
      </form>
    </Card>
  );
}
