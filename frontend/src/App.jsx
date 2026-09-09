import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';

import Dashboard from './pages/Dashboard.jsx';
import ProcessExpense from './pages/ProcessExpense.jsx';
import ClaimDetails from './pages/ClaimDetails.jsx';
import Approvals from './pages/Approvals.jsx';
import Finance from './pages/Finance.jsx';

const AppLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Navbar />

        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="/dashboard"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />

      <Route
        path="/process"
        element={
          <AppLayout>
            <ProcessExpense />
          </AppLayout>
        }
      />

      <Route
        path="/claims/:claimId"
        element={
          <AppLayout>
            <ClaimDetails />
          </AppLayout>
        }
      />

      <Route
        path="/approvals"
        element={
          <AppLayout>
            <Approvals />
          </AppLayout>
        }
      />

      <Route
        path="/finance"
        element={
          <AppLayout>
            <Finance />
          </AppLayout>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;