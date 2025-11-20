'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SheetDataViewerProps {
  linkId: number;
}

interface ProcessedRow {
    Nama: string;
    Judul: string;
    Tanggal: string;
    Jam: string;
    Ruangan: string;
    _labels?: Record<string, string>;
    [key: string]: any;
}

export default function SheetDataViewer({ linkId }: SheetDataViewerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessedRow[]>([]);
  const [sheetName, setSheetName] = useState('');

  useEffect(() => {
    fetchData();
  }, [linkId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      });

      if (!response.ok) throw new Error('Failed to fetch sheet data');

      const result = await response.json();
      setData(result.data);
      setSheetName(result.sheetName);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch sheet data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card className="p-6"><p className="text-center">Loading data...</p></Card>;
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No data found for the upcoming week (or mapping is incorrect).</p>
        <Button onClick={fetchData} variant="outline" size="sm" className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  // Determine labels from the first row
  const firstRow = data[0];
  const labels = firstRow._labels || {
      Nama: 'Nama',
      Judul: 'Judul',
      Tanggal: 'Tanggal',
      Jam: 'Jam',
      Ruangan: 'Ruangan'
  };
  const columns = ['Nama', 'Judul', 'Tanggal', 'Jam', 'Ruangan'];

  return (
    <Card className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Preview: {sheetName}</h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    {columns.map(col => (
                        <TableHead key={col}>{labels[col] || col}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((row, idx) => (
                    <TableRow key={idx}>
                        {columns.map(col => (
                            <TableCell key={col}>{row[col]}</TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Showing data for upcoming 7 days based on your configuration.
      </p>
    </Card>
  );
}
