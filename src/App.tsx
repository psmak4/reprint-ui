import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { AuthorPage } from './pages/AuthorPage';
import { LibraryPage } from './pages/LibraryPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="book/*" element={<BookDetailPage />} />
              <Route path="author/*" element={<AuthorPage />} />
              <Route
                path="library"
                element={
                  <ProtectedRoute>
                    <LibraryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reviews"
                element={
                  <ProtectedRoute>
                    <ReviewsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
