'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface Link {
  id: number;
  sheet_url: string;
  sheet_name: string;
  last_accessed?: string;
  created_at: string;
}

interface LinksListProps {
  onSelectLink?: (linkId: number) => void;
  onRefresh?: () => void;
}

export default function LinksList({ onSelectLink, onRefresh }: LinksListProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      if (!response.ok) throw new Error('Failed to fetch links');
      const data = await response.json();
      setLinks(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load spreadsheets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (linkId: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const response = await fetch(`/api/links/${linkId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({
        title: 'Success',
        description: 'Spreadsheet link deleted',
      });

      setLinks(links.filter(l => l.id !== linkId));
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete link',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <Card className="p-6"><p className="text-center">Loading...</p></Card>;
  }

  if (links.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No spreadsheets added yet</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {links.map((link) => (
        <Card key={link.id} className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{link.sheet_name}</h3>
              <p className="text-sm text-muted-foreground truncate">{link.sheet_url}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Added: {new Date(link.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="default"
                onClick={() => onSelectLink?.(link.id)}
              >
                View Data
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(link.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
