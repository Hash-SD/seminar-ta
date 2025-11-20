'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, MapPin, User, Clock, CalendarDays } from 'lucide-react';

interface ScheduleItem {
  Nama: string;
  Judul: string;
  Tanggal: string;
  Jam: string;
  Ruangan: string;
  source: string;
  _labels?: Record<string, string>;
  _department?: string;
  _type?: string;
}

interface PublicScheduleViewerProps {
  links: any[];
}

export default function PublicScheduleViewer({ links }: PublicScheduleViewerProps) {
  const [data, setData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('proposal'); // 'proposal' | 'hasil'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheets/fetch', { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
          setLastUpdated(new Date(json.fetchedAt));
        }
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = data.filter(item => {
    // Filter by Type
    const itemType = (item._type || 'proposal').toLowerCase();
    if (itemType !== activeTab) return false;

    // Filter by Search
    const search = searchTerm.toLowerCase();
    return (
      (item.Nama || '').toLowerCase().includes(search) ||
      (item.Judul || '').toLowerCase().includes(search) ||
      (item.Ruangan || '').toLowerCase().includes(search) ||
      (item._department || '').toLowerCase().includes(search)
    );
  });

  // Group filtered data by Date then Department
  const groupedByDate: Record<string, Record<string, ScheduleItem[]>> = {};

  filteredData.forEach(item => {
      const dateKey = item.Tanggal || 'Jadwal Lainnya';
      const deptKey = item._department || 'Umum';

      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = {};
      if (!groupedByDate[dateKey][deptKey]) groupedByDate[dateKey][deptKey] = [];

      groupedByDate[dateKey][deptKey].push(item);
  });

  // Sort dates if possible, otherwise rely on fetch order (usually chronological if source is sorted)
  // We'll iterate Object.keys
  const dateKeys = Object.keys(groupedByDate);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-muted border-t-foreground animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-muted-foreground tracking-wide">Memuat Jadwal...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-border/40 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:p-0 sm:mx-0 transition-all space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid w-full sm:w-[300px] grid-cols-2 rounded-full bg-secondary/50 p-1">
                    <TabsTrigger value="proposal" className="rounded-full text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Seminar Proposal</TabsTrigger>
                    <TabsTrigger value="hasil" className="rounded-full text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Seminar Hasil</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                type="search"
                placeholder="Cari Mahasiswa, Judul, Jurusan..."
                className="pl-10 h-10 rounded-xl bg-secondary/50 border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
           {lastUpdated && (
                <div className="text-right">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-secondary/50 px-3 py-1 rounded-full inline-block">
                        Updated: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )}
      </div>

      {/* Content */}
      {data.length === 0 ? (
         <div className="text-center py-32 bg-secondary/30 rounded-3xl border border-border/50 backdrop-blur-sm">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Tidak ada jadwal seminar</h2>
            <p className="text-sm text-muted-foreground">Tidak ada data untuk 7 hari ke depan.</p>
        </div>
      ) : filteredData.length === 0 ? (
          <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Tidak ditemukan jadwal untuk kategori ini.</p>
          </div>
      ) : (
          <div className="space-y-10">
              {dateKeys.map(date => (
                  <div key={date} className="space-y-6">
                      <h3 className="text-xl font-bold text-foreground sticky top-14 z-30 bg-background/95 backdrop-blur-sm py-2 px-4 -mx-4 border-l-4 border-primary">
                          {date}
                      </h3>

                      {Object.keys(groupedByDate[date]).map(dept => (
                          <div key={dept} className="pl-2 sm:pl-4 border-l border-border/50 space-y-4">
                              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                  {dept}
                              </h4>
                              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                  {groupedByDate[date][dept].map((item, index) => {
                                        const labels = item._labels || {};
                                        return (
                                        <Card key={index} className="flex flex-col p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-xl hover:border-border hover:-translate-y-1 transition-all duration-300 bg-card/40 backdrop-blur-md group">
                                            <div className="mb-5">
                                                {/* Title Section */}
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold mb-1 block">
                                                        {labels.Judul || 'Judul'}
                                                    </span>
                                                    <h3 className="text-lg font-semibold leading-snug text-foreground mb-1 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2" title={item.Judul}>
                                                        {item.Judul || 'Tidak Tersedia'}
                                                    </h3>
                                                </div>

                                                {/* Name Section */}
                                                <div className="mt-4 flex items-start gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-muted-foreground group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold block mb-0.5">
                                                            {labels.Nama || 'Mahasiswa'}
                                                        </span>
                                                        <span className="text-sm font-medium text-foreground">{item.Nama}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-border/40">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold block mb-1">
                                                            {labels.Jam || 'Waktu'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-foreground/90">
                                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                            <span>{item.Jam || '-'}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-bold block mb-1">
                                                            {labels.Ruangan || 'Ruangan'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-foreground/90">
                                                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                                                            <span className="font-medium">{item.Ruangan || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex justify-between items-end">
                                                     <span className="text-[10px] bg-secondary px-2 py-1 rounded text-muted-foreground">
                                                         {item.source}
                                                     </span>
                                                </div>
                                            </div>
                                        </Card>
                                  )})}
                              </div>
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
