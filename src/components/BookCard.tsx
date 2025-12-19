import { Link } from 'react-router-dom';
import type { Book } from '../types';
import { Image } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link to={`/book${book.workKey}`} className="group block">
      <div className="flex gap-4 p-4 rounded-lg hover:bg-card transition-colors">
        {/* Cover Image */}
        <div className="flex-shrink-0 w-24 h-36 bg-muted rounded-md overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
              <Image className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0 py-1">
          <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          {book.authors.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              by <span className="text-foreground/80">{book.authors.join(', ')}</span>
            </p>
          )}
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            {book.firstPublishYear && (
              <p>First published {book.firstPublishYear}</p>
            )}
            {book.editionCount && (
              <p>{book.editionCount.toLocaleString()} edition{book.editionCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

