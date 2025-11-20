'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, User, Clock, CalendarDays } from 'lucide-react';
import { parseFlexibleDate } from '@/lib/date-filter'; // We might need a client-side friendly version or just use string sorting

interface ScheduleItem {
  Nama: string;
  Judul: string;
  Tanggal: string;
  Jam: string;
  Ruangan: string;
  source: string;
}

interface PublicScheduleViewerProps {
  links: any[];
}

export default function PublicScheduleViewer({ links }: PublicScheduleViewerProps) {
  const [data, setData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    const search = searchTerm.toLowerCase();
    return (
      (item.Nama || '').toLowerCase().includes(search) ||
      (item.Judul || '').toLowerCase().includes(search) ||
      (item.Ruangan || '').toLowerCase().includes(search)
    );
  });

  // Group by Date
  // Since we don't have the helper client side easily unless we duplicate logic or import from a shared utils file that is client safe.
  // lib/date-filter.ts uses date-fns, which is safe.
  // But importing server code in client component might fail if it imports 'fs' etc. date-fns is fine.
  // Let's try simple grouping by the string value first? No, "17 November" vs "Senin, 17 Nov"
  // Ideally backend normalizes the date string?
  // The API returns 'Tanggal' as the string from the sheet.

  // Let's normalize and group client side for "Lebih Bagus" UI
  const groupedData: Record<string, ScheduleItem[]> = {};

  filteredData.forEach(item => {
      // We use the raw string as key, but maybe we should try to parse it to sort?
      // For now, let's just group by the exact string to avoid splitting "Same day different format".
      // Actually, mixing formats is bad.
      // Let's assume the data is relatively clean or we just list them.
      // Ideally we sort by date.
      const key = item.Tanggal || 'Lainnya';
      if (!groupedData[key]) groupedData[key] = [];
      groupedData[key].push(item);
  });

  // Sort keys? This is hard with arbitrary strings without parsing.
  // Let's just display them as they come or maybe just a grid is fine?
  // The prompt asked for "Kembangkan lagi agar lebih bagus".
  // Grouping by date header is a classic schedule view.

  const sortedKeys = Object.keys(groupedData).sort(); // Alphabetical sort isn't great for dates.

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Memuat Jadwal Seminar Pekan Ini...</p>
        </div>
    );
  }

  if (data.length === 0) {
    return (
        <div className="text-center py-20">
            <CalendarDays className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Tidak ada jadwal seminar dalam 7 hari ke depan</h2>
            <p className="text-muted-foreground">Silakan cek kembali nanti.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari Mahasiswa, Judul, atau Ruangan..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {lastUpdated && (
            <span className="text-xs text-muted-foreground">
                Terakhir update: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
        )}
      </div>

      {/* Display Grouped Data */}
      {Object.keys(groupedData).length > 0 ? (
          <div className="space-y-8">
            {/* If we can't sort effectively, maybe just one big grid is safer to avoid "Monday" appearing after "Tuesday" alphabetically
                But let's try to just show them in the order they appeared?
                Or revert to simple grid if grouping is messy.
                Let's stick to Grid but maybe with section headers if we had valid dates.
                Given the ambiguity of formats, a Grid is safer than a sorted list that is sorted wrong.

                Let's keep the Grid view but improved card design.
            */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.map((item, index) => (
                    <Card key={index} className="flex flex-col p-5 hover:shadow-md transition-shadow border-l-4 border-l-primary group">
                        <div className="mb-4">
                             <div className="flex justify-between items-start mb-2">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {item.Tanggal}
                                </span>
                             </div>
                            <h3 className="font-bold text-lg line-clamp-2 text-primary mb-1 group-hover:text-blue-600 transition-colors" title={item.Judul}>
                                {item.Judul || 'Judul Tidak Tersedia'}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-2">
                                <User className="h-4 w-4 mr-2" />
                                <span className="font-medium text-foreground">{item.Nama}</span>
                            </div>
                        </div>

                        <div className="mt-auto space-y-3 pt-3 border-t border-border/50">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                    <span>{item.Jam || '-'}</span>
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2 text-red-500" />
                                    <span className="font-semibold">{item.Ruangan || '-'}</span>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                Source: {item.source}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
          </div>
      ) : (
         searchTerm && (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Tidak ditemukan jadwal yang cocok dengan "{searchTerm}"</p>
            </div>
         )
      )}

    </div>
  );
}
