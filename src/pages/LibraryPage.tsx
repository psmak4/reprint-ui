import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTitle } from '@/hooks/use-title';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Image, Trash2, Library, ArrowUp, ArrowDown } from 'lucide-react';
import type { LibraryStatus, LibraryItem } from '../types';

export function LibraryPage() {
  useTitle('My Library');
  const [activeTab, setActiveTab] = useState<LibraryStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['library', activeTab, sortBy, sortOrder],
    queryFn: () =>
      api.getLibrary({
        status: activeTab === 'all' ? undefined : activeTab,
        sortBy,
        sortOrder,
        limit: 100,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, workKey: _workKey }: { id: string; status: LibraryStatus; workKey: string }) =>
      api.updateLibraryItem(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      // Also invalidate the specific book details if it's in the cache
      const normalizedKey = variables.workKey.replace('/works/', '').replace(/^\//, '');
      queryClient.invalidateQueries({ queryKey: ['book', normalizedKey] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, workKey: _workKey }: { id: string; workKey: string }) => api.removeFromLibrary(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      // Also invalidate the specific book details if it's in the cache
      const normalizedKey = variables.workKey.replace('/works/', '').replace(/^\//, '');
      queryClient.invalidateQueries({ queryKey: ['book', normalizedKey] });
    },
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getCoverUrl = (coverId: number | null | undefined) => {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Library</h1>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v: 'title' | 'createdAt') => setSortBy(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Added</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            {sortOrder === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LibraryStatus | 'all')}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="want_to_read">Want to Read</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-16 h-24 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-16 text-destructive">
              <p>Error loading library. Please try again.</p>
            </div>
          )}

          {data && data.data.items.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Library className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-4">Your library is empty</p>
              <Button asChild>
                <Link to="/search">Find Books to Add</Link>
              </Button>
            </div>
          )}

          {data && data.data.items.length > 0 && (
            <div className="divide-y divide-border -mx-4 px-4">
              {data.data.items.map((item) => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  coverUrl={getCoverUrl(item.coverId)}
                  onStatusChange={(status) => updateMutation.mutate({ id: item.id, status, workKey: item.workKey })}
                  onRemove={() => removeMutation.mutate({ id: item.id, workKey: item.workKey })}
                  isUpdating={updateMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LibraryItemCard({
  item,
  coverUrl,
  onStatusChange,
  onRemove,
  isUpdating,
}: {
  item: LibraryItem;
  coverUrl: string | null;
  onStatusChange: (status: LibraryStatus) => void;
  onRemove: () => void;
  isUpdating: boolean;
}) {
  return (
    <div className="group relative">
      <div className="flex gap-4 p-4 rounded-lg hover:bg-card transition-colors">
        {/* Cover Image */}
        <Link to={`/book${item.workKey}`} className="shrink-0">
          <div className="w-24 h-36 bg-muted rounded-md overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                <Image className="h-10 w-10" />
              </div>
            )}
          </div>
        </Link>

        {/* Book Info */}
        <div className="flex-1 min-w-0 py-1">
          <Link to={`/book${item.workKey}`} className="block group/title">
            <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover/title:text-primary transition-colors">
              {item.title}
            </h3>
          </Link>
          {item.authorName && (
            <p className="text-sm text-muted-foreground mt-1">
              by <span className="text-foreground/80">{item.authorName}</span>
            </p>
          )}
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            <p>Added {new Date(item.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Actions - Bottom of info on small, or right side on larger */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select
              value={item.status}
              onValueChange={onStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want_to_read">Want to Read</SelectItem>
                <SelectItem value="reading">Currently Reading</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from library?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove "{item.title}" from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
