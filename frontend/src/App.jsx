import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

import TravelRequests from './pages/TravelRequests.jsx';
import CreateTravelRequest from './pages/CreateTravelRequest.jsx';
import TravelRequestDetails from './pages/TravelRequestDetails.jsx';

import Approvals from './pages/Approvals.jsx';

import TripSettlement from './pages/TripSettlement.jsx';
import ProcessExpense from './pages/ProcessExpense.jsx';
import ClaimDetails from './pages/ClaimDetails.jsx';

import Finance from './pages/Finance.jsx';

import {
  getCurrentUser,
} from './services/auth.api.js';


const Protected = ({
  children,
}) => {

  const user =
    getCurrentUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <div className="app-shell">

      <Sidebar />

      <div className="main-area">

        <Navbar />

        {children}

      </div>

    </div>
  );
};


const ProtectedPage = ({
  children,
}) => {

  const location =
    useLocation();

  return (
    <Protected>

      <main
        className="page-container"
        key={location.pathname}
      >
        {children}
      </main>

    </Protected>
  );
};


export default function App() {

  return (
    <Routes>

      {/* =====================================================
          AUTH
      ===================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =====================================================
          ROOT
      ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedPage>
            <Dashboard />
          </ProtectedPage>
        }
      />


      {/* =====================================================
          TRAVEL REQUESTS
      ===================================================== */}

      <Route
        path="/travel-requests"
        element={
          <ProtectedPage>
            <TravelRequests />
          </ProtectedPage>
        }
      />


      <Route
        path="/travel-requests/new"
        element={
          <ProtectedPage>
            <CreateTravelRequest />
          </ProtectedPage>
        }
      />

      <Route
  path="/travel-requests/:travelRequestId/edit"
        element={
          <ProtectedPage>
            <CreateTravelRequest />
          </ProtectedPage>
        }
/>


      <Route
        path="/travel-requests/:travelRequestId"
        element={
          <ProtectedPage>
            <TravelRequestDetails />
          </ProtectedPage>
        }
      />


      {/* =====================================================
          APPROVALS
      ===================================================== */}

      <Route
        path="/approvals"
        element={
          <ProtectedPage>
            <Approvals />
          </ProtectedPage>
        }
      />


      {/* =====================================================
          SETTLEMENT
      ===================================================== */}

      <Route
        path="/settlement/:travelRequestId"
        element={
          <ProtectedPage>
            <TripSettlement />
          </ProtectedPage>
        }
      />


      {/* =====================================================
          AI PROCESSING
      ===================================================== */}

      <Route
        path="/process/:travelRequestId"
        element={
          <ProtectedPage>
            <ProcessExpense />
          </ProtectedPage>
        }
      />


      {/* =====================================================
          CLAIM DETAILS
      ===================================================== */}

      <Route
        path="/claims/:claimId"
        element={
          <ProtectedPage>
            <ClaimDetails />
          </ProtectedPage>
        }
      />


      {/* =====================================================
          FINANCE
      ===================================================== */}

      <Route
        path="/finance"
        element={
          <ProtectedPage>
            <Finance />
          </ProtectedPage>
        }
      />


      {/* =====================================================
          FALLBACK
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}