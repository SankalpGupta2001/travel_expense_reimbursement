import {
  NavLink,
} from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          N
        </div>

        <div>
          <div className="brand-name">
            NORTEX
          </div>

          <div className="brand-subtitle">
            Expense Portal
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className="nav-link"
        >
          <span>▦</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/process"
          className="nav-link"
        >
          <span>＋</span>
          Process Expense
        </NavLink>

        <NavLink
          to="/approvals"
          className="nav-link"
        >
          <span>✓</span>
          Approvals
        </NavLink>

        <NavLink
          to="/finance"
          className="nav-link"
        >
          <span>₹</span>
          Finance
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="policy-box">
          <strong>
            Travel Policy
          </strong>

          <span>
            Effective 1 Apr 2026
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;