import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Library, ArrowRight, Bookmark, PenLine } from 'lucide-react';
import { TrendingBooks } from '../components/TrendingBooks';
import { useAuth } from '@/hooks/use-auth';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section - Centered and clean */}
      <section className="py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1]">
            Track what you read.
            <br />
            <span className="text-muted-foreground">Discover what's next.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Build your library, share reviews, and find your next favorite book from millions of titles.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search books, authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background"
                />
              </div>
              <Button type="submit" className="h-12 px-6">
                Search
              </Button>
            </div>
          </form>

          {/* Quick Actions */}
          {!isAuthenticated && (
            <div className="flex items-center justify-center gap-4 text-sm">
              <Button variant="link" className="p-0 h-auto text-foreground" asChild>
                <Link to="/register">
                  Create free account
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <span className="text-muted-foreground">or</span>
              <Button variant="link" className="p-0 h-auto text-muted-foreground" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Trending Books Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <TrendingBooks />
        </div>
      </section>

      {/* Features Section - Bento grid */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Large feature card */}
            <div className="md:row-span-2 p-8 rounded-2xl border border-border bg-card flex flex-col justify-between min-h-80">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-primary">Discover</span>
                <h3 className="text-2xl font-bold mt-2 mb-3">Millions of books at your fingertips</h3>
                <p className="text-muted-foreground">
                  Search the entire Open Library catalog. Find books by title, author, ISBN, or subject. Your next favorite read is waiting.
                </p>
              </div>
              <Search className="h-12 w-12 text-primary/30" />
            </div>

            {/* Smaller feature cards */}
            <div className="p-6 rounded-2xl border border-border bg-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Build your library</h3>
                <p className="text-sm text-muted-foreground">
                  Organize books into reading, read, and want-to-read shelves. Track your progress.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share your thoughts</h3>
                <p className="text-sm text-muted-foreground">
                  Write reviews, rate books, and help the community discover great reads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section - Refined */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xl md:text-2xl font-light text-foreground/80 leading-relaxed">
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </p>
          <p className="text-sm text-muted-foreground mt-4">— George R.R. Martin</p>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-medium text-primary mb-3">Get started</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start your reading journey</h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              Join readers who track their books, share reviews, and discover new favorites.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="group inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <span className="font-medium">Create free account</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/login"
                className="group inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
              >
                <span className="font-medium">Sign in</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground mt-8">
              Free forever • No credit card required
            </p>
          </div>
        </section>
      )}

      {/* Logged in user CTA */}
      {isAuthenticated && (
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-medium text-primary mb-3">What's next?</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-10">Jump back in</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/search"
                className="group inline-flex items-center gap-3 px-6 py-4 rounded-full border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Search className="h-5 w-5 text-primary" />
                <span className="font-medium">Search for books</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
              
              <Link 
                to="/library"
                className="group inline-flex items-center gap-3 px-6 py-4 rounded-full border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Library className="h-5 w-5 text-primary" />
                <span className="font-medium">View my library</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
