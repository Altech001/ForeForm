import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormFill from './pages/FormFill';
import FormResponses from './pages/FormResponses';
import ResponseView from './pages/ResponseView';
import AIRespondents from './pages/AIRespondents';
import ComplexAI from './pages/ComplexAI';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DocxPreview from './pages/DocxPreview';
import ProfilePage from './pages/ProfilePage';
import ProfileWidget from './components/widget/profile';
import TasksIndex from './pages/Tasks/Index';
import ViewTask from './pages/Tasks/ViewTask';
import Documents from './pages/Tasks/Documents';
import MeritePlans from './pages/MeriteBills/Plans';
import MeritePlanDetails from './pages/MeriteBills/PlanDetails';
import MeriteTransactions from './pages/MeriteBills/Transactions';
import MeriteUsers from './pages/MeriteBills/Users';
import { Navigate, Outlet } from 'react-router-dom';

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
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
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App