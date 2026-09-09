import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate =
    useNavigate();

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">
          Travel Expense Management
        </h1>

        <p className="topbar-subtitle">
          Nortex Industries
        </p>
      </div>

      <div className="topbar-user">
        <div className="avatar">
          CR
        </div>

        <div>
          <strong>
            Chaitanya Reddy
          </strong>

          <span>
            NX-4471
          </span>
        </div>

        <button
          className="icon-button"
          onClick={() =>
            navigate('/dashboard')
          }
        >
          ⌂
        </button>
      </div>
    </header>
  );
};

export default Navbar;