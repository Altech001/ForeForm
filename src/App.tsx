import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/lib/AuthContext';
import { useAuth } from '@/lib/useAuth';
import { queryClientInstance } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster as SonnerToaster } from "sonner";
import ProfileWidget from './components/widget/AITipsy';
import PageNotFound from './lib/PageNotFound';
import AIRespondents from './pages/AIRespondents';
import ComplexAI from './pages/ComplexAI';
import Dashboard from './pages/Dashboard';
import DocxPreview from './pages/DocxPreview';
import FormBuilder from './pages/FormBuilder';
import FormFill from './pages/FormFill';
import FormResponses from './pages/FormResponses';
import Login from './pages/Login';
import MeritePlanDetails from './pages/MeriteBills/PlanDetails';
import MeritePlans from './pages/MeriteBills/Plans';
import MeriteTransactions from './pages/MeriteBills/Transactions';
import MeriteUsers from './pages/MeriteBills/Users';
import ProfilePage from './pages/ProfilePage';
import ResponseView from './pages/ResponseView';
import Signup from './pages/Signup';
import Documents from './pages/Tasks/Documents';
import TasksIndex from './pages/Tasks/Index';
import ViewTask from './pages/Tasks/ViewTask';
import AgentPage from './pages/agent';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import AdminDashboard from './pages/AdminDashboard';
import ConnectorsPage from './pages/connectors';

const AppSkeletonLoader = () => (
  <div className="fixed inset-0 bg-background flex z-50">
    <div className="w-64 hidden md:flex flex-col p-6 space-y-6">
      <Skeleton className="h-8 w-3/4 mb-4" />
      <div className="space-y-4 mt-8">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-16 flex items-center px-6 justify-between">
        <Skeleton className="h-6 w-1/4" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="p-8 space-y-8 flex-1">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  </div>
);

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <AppSkeletonLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const isPublicFormRoute = window.location.pathname.startsWith('/f/');

  // Always allow public form routes without auth
  if (isPublicFormRoute) {
    return (
      <Routes>
        <Route path="/f/:id" element={<FormFill />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <AppSkeletonLoader />;
  }

  // Handle legacy auth errors (if any still trigger)
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Navigate to="/login" replace />;
    }
  }

  // Render the main app routes nested in ProtectedRoute where needed
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/forms/:id/edit" element={<FormBuilder />} />
          <Route path="/forms/:id/responses" element={<FormResponses />} />
          <Route path="/forms/:formId/responses/:responseId" element={<ResponseView />} />
          <Route path="/ai-respondents" element={<AIRespondents />} />
          <Route path="/ai-respondents/:formId" element={<AIRespondents />} />
          <Route path="/forms/:formId/ai-respondents" element={<AIRespondents />} />
          <Route path="/complex-ai" element={<ComplexAI />} />
          <Route path="/docx-preview" element={<DocxPreview />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookmark-tasks" element={<TasksIndex />} />
          <Route path="/bookmark-tasks/:taskId" element={<ViewTask />} />
          <Route path="/bookmark-documents" element={<Documents />} />
          <Route path="/plans" element={<MeritePlans />} />
          <Route path="/plans/:id" element={<MeritePlanDetails />} />
          <Route path="/transactions" element={<MeriteTransactions />} />
          <Route path="/users" element={<MeriteUsers />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/connectors" element={<ConnectorsPage />} />
          <Route path="/integrations/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ProfileWidget />
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster richColors position="top-center" className="rounded-none shadow-none" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
