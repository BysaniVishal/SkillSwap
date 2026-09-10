import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatWidget from "./components/ChatWidget";
import ScrollToTop from "./components/ScrollToTop";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Discover = lazy(() => import("./pages/Discover"));
const Requests = lazy(() => import("./pages/Requests"));
const Swaps = lazy(() => import("./pages/Swaps"));
const SessionRoom = lazy(() => import("./pages/SessionRoom"));
const SwapChatPage = lazy(() => import("./pages/SwapChatPage"));

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/swaps"
            element={
              <ProtectedRoute>
                <Swaps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:sessionId/room"
            element={
              <ProtectedRoute>
                <SessionRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/swaps/:swapId/chat"
            element={
              <ProtectedRoute>
                <SwapChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <ChatWidget />
    </>
  );
}

export default App;
