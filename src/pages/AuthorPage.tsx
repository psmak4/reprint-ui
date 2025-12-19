import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  BookOpen, 
  Calendar, 
  ExternalLink,
  Image,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function AuthorPage() {
  const { '*': authorId } = useParams();
  // authorId is just the ID like "OL26320A"
  const authorKey = `/authors/${authorId}`;
  const [showFullBio, setShowFullBio] = useState(false);
  const [showAllWorks, setShowAllWorks] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['author', authorKey],
    queryFn: () => api.getAuthorDetails(authorKey),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64 flex-shrink-0">
            <Skeleton className="w-full aspect-square rounded-lg" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <User className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-destructive mb-4">Error loading author details.</p>
        <Button asChild>
          <Link to="/search">Back to Search</Link>
        </Button>
      </div>
    );
  }

  const { author, works, totalWorks } = data.data;
  const displayedWorks = showAllWorks ? works : works.slice(0, 12);

  // Format life dates
  const lifeDates = author.birthDate 
    ? author.deathDate 
      ? `${author.birthDate} – ${author.deathDate}`
      : `Born ${author.birthDate}`
    : author.deathDate 
      ? `Died ${author.deathDate}`
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Author Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Author Photo */}
        <div className="md:w-64 flex-shrink-0">
          <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden shadow-lg">
            {author.photoUrl ? (
              <img
                src={author.photoUrl}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                <User className="h-24 w-24" />
              </div>
            )}
          </div>

          {/* External Links */}
          {(author.wikipedia || author.links.length > 0) && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-2">External Links</p>
              {author.wikipedia && (
                <Button variant="outline" className="w-full justify-start overflow-hidden" asChild>
                  <a href={author.wikipedia} target="_blank" rel="noopener noreferrer" title="Wikipedia">
                    <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Wikipedia</span>
                  </a>
                </Button>
              )}
              {author.links.slice(0, 3).map((link, i) => (
                <Button key={i} variant="outline" className="w-full justify-start overflow-hidden" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.title}>
                    <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{link.title}</span>
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            {author.name}
          </h1>

          {lifeDates && (
            <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {lifeDates}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">{totalWorks.toLocaleString()}</span>
              <span>work{totalWorks !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Bio */}
          {author.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className={`text-muted-foreground leading-relaxed whitespace-pre-line ${!showFullBio ? 'line-clamp-6' : ''}`}>
                {author.bio}
              </p>
              {author.bio.length > 500 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-primary hover:underline text-sm mt-2 font-medium flex items-center gap-1"
                >
                  {showFullBio ? (
                    <>Show less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show more <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Alternate Names */}
          {author.alternateNames.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Also known as: </span>
                {author.alternateNames.slice(0, 5).join(', ')}
                {author.alternateNames.length > 5 && ` and ${author.alternateNames.length - 5} more`}
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Books Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Books by {author.name}
          <span className="text-lg font-normal text-muted-foreground">({totalWorks})</span>
        </h2>

        {works.length > 0 ? (
          <>
            <div className="space-y-4">
              {displayedWorks.map((work) => (
                <Link
                  key={work.workKey}
                  to={`/book${work.workKey}`}
                  className="group block"
                >
                  <div className="flex gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors">
                    {/* Cover */}
                    <div className="w-16 h-24 flex-shrink-0 bg-muted rounded overflow-hidden">
                      {work.coverUrl ? (
                        <img
                          src={work.coverUrl}
                          alt={work.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Image className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {work.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {author.name}
                      </p>
                      {work.firstPublishDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                          First published {work.firstPublishDate}
                        </p>
                      )}
                      {work.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {work.subjects.slice(0, 3).map((subject) => (
                            <span
                              key={subject}
                              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {works.length > 12 && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAllWorks(!showAllWorks)}
                  className="gap-2"
                >
                  {showAllWorks ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All {works.length} Books
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No books found for this author.</p>
          </div>
        )}
      </div>

      {/* Open Library Attribution */}
      <div className="mt-12 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          Author data provided by{' '}
          <a 
            href={`https://openlibrary.org${author.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open Library
          </a>
        </p>
      </div>
    </div>
  );
}
