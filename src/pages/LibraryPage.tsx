import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    mutationFn: ({ id, status }: { id: string; status: LibraryStatus }) =>
      api.updateLibraryItem(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeFromLibrary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
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
                  <Skeleton className="w-16 h-24 flex-shrink-0" />
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
            <div className="space-y-4">
              {data.data.items.map((item) => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  coverUrl={getCoverUrl(item.coverId)}
                  onStatusChange={(status) => updateMutation.mutate({ id: item.id, status })}
                  onRemove={() => removeMutation.mutate(item.id)}
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
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Cover */}
          <Link to={`/book${item.workKey}`} className="flex-shrink-0">
            <div className="w-16 h-24 bg-muted rounded overflow-hidden">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Image className="h-6 w-6" />
                </div>
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link to={`/book${item.workKey}`}>
              <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                {item.title}
              </h3>
            </Link>
            {item.authorName && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                by {item.authorName}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Added {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Select
              value={item.status}
              onValueChange={onStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-40">
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
                <Button variant="outline" size="icon">
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
      </CardContent>
    </Card>
  );
}
