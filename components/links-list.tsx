'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

interface Link {
  id: number;
  sheet_url: string;
  sheet_name: string;
  last_accessed?: string;
  created_at: string;
  configuration?: any;
}

interface LinksListProps {
  onSelectLink?: (linkId: number) => void;
  onRefresh?: () => void;
}

export default function LinksList({ onSelectLink, onRefresh }: LinksListProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleManualRefreshAll = async () => {
      setRefreshing(true);
      try {
          const res = await fetch('/api/links/refresh-all', { method: 'POST' });
          if (res.ok) {
               const json = await res.json();
               toast({
                   title: 'Refresh Complete',
                   description: json.message || 'All spreadsheets refreshed successfully.',
               });
               onRefresh?.(); // Trigger parent refresh if needed
          } else {
              throw new Error('Refresh failed');
          }
      } catch (error) {
          toast({
              title: 'Error',
              description: 'Failed to refresh data. Check logs.',
              variant: 'destructive'
          });
      } finally {
          setRefreshing(false);
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

  return (
    <div className="space-y-4">

      {links.length === 0 ? (
         <Card className="p-6">
            <p className="text-center text-muted-foreground">No spreadsheets added yet. Add one to start.</p>
         </Card>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => (
            <Card key={link.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{link.sheet_name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{link.sheet_url}</p>
                   <div className="flex gap-2 mt-2">
                       {link.configuration?.auto_refresh && (
                           <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                               Auto Refresh: {link.configuration.refresh_interval}m
                           </span>
                       )}
                        <span className="text-xs text-muted-foreground">
                            Added: {new Date(link.created_at).toLocaleDateString()}
                        </span>
                   </div>
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
      )}
    </div>
  );
}
