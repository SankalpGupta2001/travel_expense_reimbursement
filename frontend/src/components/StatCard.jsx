const StatCard = ({ label, title, value, description, icon }) => {
  const heading = title || label;
  return (
    <div className="stat-card">

      <div className="stat-label">
        {icon && <span className="stat-icon">{icon}</span>}
        {heading}
      </div>

      <div className="stat-value">
        {value}
      </div>

      {description && (
        <div className="stat-description">
          {description}
        </div>
      )}

    </div>
  );
};


export default StatCard;

