import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, RoleBasedRoute, PublicOnlyRoute } from './components/protectedRoute/ProtectedRoute';
import Navbar from './components/navbar/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register'
import UserProfile from './pages/Profile/UserProfile'
import UserUpdateBulletin from './pages/UserUpdateBulletin/UserUpdateBulletin';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import AdminUsers from './pages/AdminUsers/AdminUsers';
import AdminUserEdit from './pages/AdminUserEdit/AdminUserEdit';
import AdminBulletins from './pages/AdminBulletins/AdminBulletins';
import NotFound from './pages/NotFound/NotFound'
import UnAuthorized from './pages/UnAuthorized/UnAuthorized'
import UpdateProfile from './pages/UpdateProfile/UpdateProfile';
import AdminReports from './pages/AdminReports/AdminReports';

// Layout component for admin pages
const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
};

// Layout component for regular pages
const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <Navbar />
      {children}
    </div>
  );
};


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
          <Routes>
            {/* Public routes that are only accessible when NOT logged in */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={
                <MainLayout>
                <Login />
                </MainLayout>
              } />
              <Route path="/register" element={
                <MainLayout>
                <Register />
                </MainLayout>
              } />
            </Route>
            
            {/* Public routes accessible to everyone */}
            <Route path="/unauthorized" element={
              <MainLayout>
              <UnAuthorized />
              </MainLayout>
            } />

            {/* Protected routes (require authentication) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={
                <MainLayout>
                <Home />
                </MainLayout>
              } />
              <Route path="/user" element={
                <MainLayout>
                <UserProfile />
                </MainLayout>
              } />
              <Route path="/user/bulletin/:id" element={
                <MainLayout>
                <UserUpdateBulletin />
                </MainLayout>
              } />

              <Route path="/user/update/:id" element={
                <MainLayout>
                <UpdateProfile />
                </MainLayout>
              } />
            </Route>


                {/* Admin Routes */}

            <Route path="/admin" element={
              <RoleBasedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </RoleBasedRoute>
            } />

            <Route path="/admin/users" element={
              <RoleBasedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </RoleBasedRoute>
            } />

            <Route path="/admin/users/edit/:id" element={
              <RoleBasedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminUserEdit />
                </AdminLayout>
              </RoleBasedRoute>
            } />

            <Route path="/admin/bulletins" element={
              <RoleBasedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminBulletins />
                </AdminLayout>
              </RoleBasedRoute>
            } />

            <Route path="/admin/reports" element={
              <RoleBasedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminReports />
                </AdminLayout>
              </RoleBasedRoute>
            } />


            {/* 404 route */}
            <Route path="*" element={
              <MainLayout>
              <NotFound />
              </MainLayout>
            } />

          </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;