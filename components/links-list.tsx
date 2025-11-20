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
  configuration?: any;
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
                  <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{link.sheet_name}</h3>
                      {link.configuration?.type && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              link.configuration.type === 'proposal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                              {link.configuration.type === 'proposal' ? 'Proposal' : 'Hasil'}
                          </span>
                      )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{link.sheet_url}</p>

                  <div className="flex flex-wrap gap-2 mt-2">
                       {link.configuration?.department && (
                           <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                               {link.configuration.department}
                           </span>
                       )}
                       {link.configuration?.auto_refresh && (
                           <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                               Cache: {link.configuration.refresh_interval}m
                           </span>
                       )}
                        <span className="text-xs text-muted-foreground pt-0.5">
                            Added: {new Date(link.created_at).toLocaleDateString()}
                        </span>
                   </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSelectLink?.(link.id)}
                  >
                    Preview
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
