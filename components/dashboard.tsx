'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddLinkForm from './add-link-form';
import LinksList from './links-list';
import SheetDataViewer from './sheet-data-viewer';
import { ModeToggle } from './mode-toggle';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session } = useSession();
  const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Apple-style Admin Header */}
      <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur-xl border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[980px] mx-auto px-4 h-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-foreground hover:opacity-70 transition-opacity">
                Dashboard
            </Link>
            <span className="text-xs text-muted-foreground border-l border-border pl-4 h-4 flex items-center">
                {session?.user?.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
                Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[980px] mx-auto px-4 py-12">
        <Tabs defaultValue="links" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-secondary/50 p-1 rounded-full">
                <TabsTrigger value="links" className="rounded-full text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">My Spreadsheets</TabsTrigger>
                <TabsTrigger value="add" className="rounded-full text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Add New</TabsTrigger>
            </TabsList>
          </div>

          {selectedLinkId && (
             <div className="flex justify-center -mt-4">
                <Button variant="link" size="sm" onClick={() => setSelectedLinkId(null)} className="text-xs">
                    &larr; Back to List
                </Button>
             </div>
          )}

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-6 focus-visible:outline-none">
            {selectedLinkId ? (
                <SheetDataViewer linkId={selectedLinkId} />
            ) : (
                <LinksList
                  key={refreshKey}
                  onSelectLink={setSelectedLinkId}
                  onRefresh={handleRefresh}
                />
            )}
          </TabsContent>

          {/* Add Link Tab */}
          <TabsContent value="add" className="focus-visible:outline-none">
            <div className="max-w-xl mx-auto">
                <AddLinkForm onSuccess={handleRefresh} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
