const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for Better Auth session
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  // Books
  async searchBooks(query: string, page = 1, limit = 20) {
    return this.request<import('./types').BookSearchResponse>(
      `/books/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  async getBookDetails(workKey: string, isbn?: string) {
    // Strip /works/ prefix and any leading slashes
    let key = workKey;
    if (key.startsWith('/works/')) {
      key = key.slice(7);
    } else if (key.startsWith('/')) {
      key = key.slice(1);
    }
    const url = isbn ? `/books/${key}?isbn=${isbn}` : `/books/${key}`;
    return this.request<import('./types').BookDetailsResponse>(url);
  }

  // Authors
  async getAuthorDetails(authorKey: string) {
    // Remove /authors/ prefix if present since the API route already has it
    const key = authorKey.startsWith('/authors/') ? authorKey.slice(9) : authorKey;
    return this.request<import('./types').AuthorDetailsResponse>(`/authors/${key}`);
  }

  // Trending
  async getNytBestSellers(list = 'hardcover-fiction') {
    return this.request<{
      success: boolean;
      data: {
        source: string;
        list: string;
        books: import('./types').TrendingBook[];
        count: number;
      };
    }>(`/trending/nytimes?list=${list}`);
  }

  // Library
  async getLibrary(params?: { status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    
    return this.request<import('./types').LibraryResponse>(`/library?${searchParams.toString()}`);
  }

  async addToLibrary(data: {
    workKey: string;
    title: string;
    authorName?: string;
    coverId?: number;
    status: import('./types').LibraryStatus;
  }) {
    return this.request<{ success: boolean; data: { item: import('./types').LibraryItem } }>(
      '/library',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateLibraryItem(id: string, status: import('./types').LibraryStatus) {
    return this.request<{ success: boolean; data: { item: import('./types').LibraryItem } }>(
      `/library/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  }

  async removeFromLibrary(id: string) {
    return this.request<{ success: boolean; message: string }>(`/library/${id}`, {
      method: 'DELETE',
    });
  }

  // Reviews
  async getMyReviews() {
    return this.request<{ success: boolean; data: { reviews: import('./types').Review[] } }>('/reviews/me');
  }

  async getUserReviews() {
    return this.request<{ success: boolean; data: { reviews: import('./types').Review[] } }>('/reviews/me');
  }

  async createReview(data: {
    workKey: string;
    bookTitle: string;
    rating: number;
    content: string;
    hasSpoilers: boolean;
  }) {
    return this.request<{ success: boolean; data: { review: import('./types').Review }; message: string }>(
      '/reviews',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateReview(id: string, data: { rating?: number; content?: string; hasSpoilers?: boolean }) {
    return this.request<{ success: boolean; data: { review: import('./types').Review }; message: string }>(
      `/reviews/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteReview(id: string) {
    return this.request<{ success: boolean; message: string }>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin
  async getPendingReviews(page = 1, limit = 20) {
    return this.request<{
      success: boolean;
      data: { reviews: import('./types').PendingReview[]; pagination: import('./types').Pagination };
    }>(`/admin/reviews/pending?page=${page}&limit=${limit}`);
  }

  async getAdminReviews(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    return this.request<{
      success: boolean;
      data: { reviews: import('./types').Review[]; pagination: import('./types').Pagination };
    }>(`/admin/reviews?${searchParams.toString()}`);
  }

  async approveReview(id: string) {
    return this.request<{ success: boolean; data: { review: import('./types').Review }; message: string }>(
      `/admin/reviews/${id}/action`,
      {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      }
    );
  }

  async rejectReview(id: string) {
    return this.request<{ success: boolean; data: { review: import('./types').Review }; message: string }>(
      `/admin/reviews/${id}/action`,
      {
        method: 'POST',
        body: JSON.stringify({ action: 'reject' }),
      }
    );
  }

  async reviewAction(id: string, action: 'approve' | 'reject') {
    return this.request<{ success: boolean; data: { review: import('./types').Review }; message: string }>(
      `/admin/reviews/${id}/action`,
      {
        method: 'POST',
        body: JSON.stringify({ action }),
      }
    );
  }

  async getAdminStats() {
    return this.request<{
      success: boolean;
      data: { pendingReviews: number; totalUsers: number; totalReviews: number };
    }>('/admin/stats');
  }
}

export const api = new ApiClient();
