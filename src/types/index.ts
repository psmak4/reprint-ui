// User types
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// Book types
export interface Book {
  workKey: string;
  title: string;
  authors: string[];
  authorKeys?: string[];
  firstPublishYear?: number;
  coverId?: number;
  coverUrl?: string | null;
  isbn?: string;
  editionCount?: number;
}

export interface BookDetails {
  workKey: string;
  title: string;
  subtitle?: string;
  description?: string | null;
  authors: Array<{ key: string; name: string }>;
  coverId?: number;
  coverUrl?: string | null;
  subjects: string[];
  firstPublishDate?: string;
  links: Array<{ title: string; url: string }>;
}

export interface BookSearchResponse {
  success: boolean;
  data: {
    books: Book[];
    pagination: Pagination;
  };
}

export interface RatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface OpenLibraryRatings {
  average: string;
  count: number;
  breakdown: RatingBreakdown;
}

export interface BookDetailsResponse {
  success: boolean;
  data: {
    book: BookDetails;
    reviews: ReviewWithUser[];
    averageRating: string | null;
    reviewCount: number;
    reprintBreakdown: RatingBreakdown;
    openLibraryRatings: OpenLibraryRatings | null;
    libraryItem: LibraryItem | null;
    userReview: Review | null;
  };
}

// Library types
export type LibraryStatus = 'reading' | 'read' | 'want_to_read';

export interface LibraryItem {
  id: string;
  userId: string;
  workKey: string;
  title: string;
  authorName?: string | null;
  coverId?: number | null;
  status: LibraryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryResponse {
  success: boolean;
  data: {
    items: LibraryItem[];
    pagination: Pagination;
  };
}

// Review types
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  userId: string;
  workKey: string;
  bookTitle: string;
  rating: number;
  content: string;
  hasSpoilers: boolean;
  containsSpoilers?: boolean; // Alias for hasSpoilers
  status: ReviewStatus;
  coverId?: number | null;
  username?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithUser {
  id: string;
  rating: number;
  content: string;
  hasSpoilers: boolean;
  createdAt: string;
  username: string;
  userId: string;
  isOwn?: boolean;
  status?: ReviewStatus;
}

export interface PendingReview extends Review {
  username: string;
  userEmail: string;
}

// Pagination
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Author types
export interface Author {
  key: string;
  name: string;
  bio?: string | null;
  birthDate?: string;
  deathDate?: string;
  photoId?: number;
  photoUrl?: string | null;
  wikipedia?: string;
  links: Array<{ title: string; url: string }>;
  alternateNames: string[];
}

export interface AuthorWork {
  workKey: string;
  title: string;
  coverId?: number;
  coverUrl?: string | null;
  firstPublishDate?: string;
  subjects: string[];
}

export interface AuthorDetailsResponse {
  success: boolean;
  data: {
    author: Author;
    works: AuthorWork[];
    totalWorks: number;
  };
}

// Trending types
export type TrendingPeriod = 'daily' | 'weekly' | 'monthly';

export interface TrendingBook {
  workKey: string;
  title: string;
  authors: string[];
  authorKeys: string[];
  coverId?: number;
  coverUrl?: string | null;
  firstPublishYear?: number;
  editionCount?: number;
}

export interface TrendingBooksResponse {
  success: boolean;
  data: {
    period: TrendingPeriod;
    books: TrendingBook[];
    count: number;
  };
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
}
