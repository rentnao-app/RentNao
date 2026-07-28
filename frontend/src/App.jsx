import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import SignUp from './pages/SignUp';
import LogIn from './pages/LogIn';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthVerificationPage from './pages/AuthVerificationPage';
import GoogleAuthCallbackPage from './pages/GoogleAuthCallbackPage';
import OAuthPhoneSetupPage from './pages/OAuthPhoneSetupPage';
import TenantRegistrationPage from './pages/TenantRegistrationPage';
import OwnerRegistrationPage from './pages/OwnerRegistrationPage';
import VerificationPage from './pages/VerificationPage';
import VerificationHoldingPage from './pages/VerificationHoldingPage';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import MyPropertiesPage from './pages/MyPropertiesPage';
import CreateListingPage from './pages/CreateListingPage';
import OwnerPropertyEditPage from './pages/OwnerPropertyEditPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import WishlistPage from './pages/WishlistPage';
import IncomingRequestsPage from './pages/IncomingRequestsPage';
import MyRentalsPage from './pages/MyRentalsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import FAQPage from './pages/FAQPage';
import CareersPage from './pages/CareersPage';
import BlogsPage from './pages/BlogsPage';
import BlogPostPage from './pages/BlogPostPage';
import ServicesPage from './pages/ServicesPage';
import ReviewPage from './pages/ReviewPage';
import NotFoundPage from './pages/NotFoundPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import ListingPage from './pages/ListingPage';
import ListingDetailsPage from './pages/ListingDetailsPage';
import WalletPage from './pages/WalletPage';
import AdminTopupApprovalsPage from './pages/AdminTopupApprovalsPage';
import ChatsPage from './pages/ChatsPage';
import ChatThreadPage from './pages/ChatThreadPage';
import ProtectedRoute from './components/ProtectedRoute';
import SiteFooter from './components/SiteFooter';
import PlatformReviewPrompt from './components/PlatformReviewPrompt';
import ArefinDevTestPage from './pages/dev/ArefinDevTestPage';

function AppLayout() {
  const { pathname } = useLocation();
  const hideFooter = pathname.startsWith('/admin-dashboard') || pathname.startsWith('/chats');

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip max-w-full">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth-verification" element={<AuthVerificationPage />} />
          <Route path="/auth/phone-setup" element={<OAuthPhoneSetupPage />} />
          <Route path="/auth/callback" element={<GoogleAuthCallbackPage />} />
          <Route path="/tenant-registration" element={<TenantRegistrationPage />} />
          <Route path="/owner-registration" element={<OwnerRegistrationPage />} />
          <Route path="/verification" element={<VerificationPage />} />
          <Route path="/verification-holding" element={<VerificationHoldingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/:slug" element={<BlogPostPage />} />
          <Route path="/service" element={<ServicesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/reviews" element={<ReviewPage />} />
          <Route path="/listings" element={<ListingPage />} />
          <Route path="/browse" element={<ListingPage />} />
          <Route path="/listings/:id" element={<ListingDetailsPage />} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
          <Route path="/tenant-dashboard" element={<ProtectedRoute component={TenantDashboard} requiredRole="TENANT" />} />
          <Route path="/tenant-dashboard/applications" element={<ProtectedRoute component={MyApplicationsPage} requiredRole="TENANT" />} />
          <Route path="/tenant-dashboard/wishlist" element={<ProtectedRoute component={WishlistPage} requiredRole="TENANT" />} />
          <Route path="/owner-dashboard" element={<ProtectedRoute component={OwnerDashboard} requiredRole="OWNER" />} />
          <Route path="/owner-dashboard/my-properties" element={<ProtectedRoute component={MyPropertiesPage} requiredRole="OWNER" />} />
          <Route path="/owner-dashboard/my-properties/:propertyId/edit" element={<ProtectedRoute component={OwnerPropertyEditPage} requiredRole="OWNER" />} />
          <Route path="/owner-dashboard/create-listing" element={<ProtectedRoute component={CreateListingPage} requiredRole="OWNER" />} />
          <Route path="/owner-dashboard/requests" element={<ProtectedRoute component={IncomingRequestsPage} requiredRole="OWNER" />} />
          <Route path="/dashboard/rentals" element={<ProtectedRoute component={MyRentalsPage} requiredRole={null} />} />
          <Route path="/notifications" element={<ProtectedRoute component={NotificationsPage} requiredRole={null} />} />
          <Route path="/chats" element={<ProtectedRoute component={ChatsPage} requiredRole={null} />} />
          <Route path="/chats/:conversationId" element={<ProtectedRoute component={ChatThreadPage} requiredRole={null} />} />
          <Route path="/admin-dashboard" element={<ProtectedRoute component={AdminDashboard} requiredRole="ADMIN" />} />
          <Route path="/admin-dashboard/topup-approvals" element={<ProtectedRoute component={AdminTopupApprovalsPage} requiredRole="ADMIN" />} />
          <Route path="/account" element={<ProtectedRoute component={AccountSettingsPage} requiredRole={null} />} />
          <Route path="/wallet" element={<ProtectedRoute component={WalletPage} requiredRole={null} />} />
          {import.meta.env.DEV ? (
            <Route
              path="/dev/arefin-test"
              element={<ProtectedRoute component={ArefinDevTestPage} requiredRole={null} />}
            />
          ) : null}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {!hideFooter ? <SiteFooter /> : null}
      <PlatformReviewPrompt />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{ top: 16 }}
        toastOptions={{
          duration: 4200,
          className: 'shadow-lg border border-gray-100',
          style: {
            background: '#fff',
            color: '#111827',
            borderRadius: '12px',
            padding: '12px 18px',
            fontSize: '14px',
            maxWidth: 'min(420px, calc(100vw - 32px))',
            boxShadow: '0 12px 40px rgba(15, 118, 110, 0.12), 0 4px 12px rgba(0,0,0,0.06)',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
      <AppLayout />
    </Router>
  );
}

export default App;
