'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface SheetDataViewerProps {
  linkId: number;
}

export default function SheetDataViewer({ linkId }: SheetDataViewerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<string[][]>([]);
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
        <p className="text-center text-muted-foreground">No data found for today</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Data from {sheetName}</h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-muted/50' : ''}>
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-2 border border-border text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Showing data for today only. Last updated: {new Date().toLocaleString()}
      </p>
    </Card>
  );
}
