const StatusBadge = ({
  status,
}) => {
  const normalized =
    (status || 'Unknown')
      .toLowerCase()
      .replace(/\s+/g, '-');

  return (
    <span
      className={`status-badge status-${normalized}`}
    >
      <span className="status-dot" />
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;