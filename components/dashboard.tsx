'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddLinkForm from './add-link-form';
import LinksList from './links-list';
import SheetDataViewer from './sheet-data-viewer';

export default function Dashboard() {
  const { data: session } = useSession();
  const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Spreadsheet Reader</h1>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="links" className="space-y-4">
          <TabsList>
            <TabsTrigger value="links">My Spreadsheets</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
            {selectedLinkId && <TabsTrigger value="view">View Data</TabsTrigger>}
          </TabsList>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4">
            <LinksList
              key={refreshKey}
              onSelectLink={setSelectedLinkId}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          {/* Add Link Tab */}
          <TabsContent value="add">
            <AddLinkForm onSuccess={handleRefresh} />
          </TabsContent>

          {/* View Data Tab */}
          {selectedLinkId && (
            <TabsContent value="view">
              <SheetDataViewer linkId={selectedLinkId} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
