const FormSection = ({
  number,
  title,
  description,
  children,
}) => {
  return (
    <section className="travel-form-section">
      <div className="travel-form-section-header">
        <div className="travel-form-section-number">
          {number}
        </div>

        <div>
          <h3>{title}</h3>

          {description && (
            <p>
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="travel-form-section-body">
        {children}
      </div>
    </section>
  );
};

export default FormSection;