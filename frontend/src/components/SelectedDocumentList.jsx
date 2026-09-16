const getFileIcon = (
  file
) => {
  const extension =
    file.name
      ?.split('.')
      .pop()
      ?.toLowerCase();

  if (
    extension === 'pdf'
  ) {
    return 'PDF';
  }

  if (
    [
      'png',
      'jpg',
      'jpeg',
    ].includes(extension)
  ) {
    return 'IMG';
  }

  if (
    extension === 'eml'
  ) {
    return 'EML';
  }

  if (
    [
      'xls',
      'xlsx',
    ].includes(extension)
  ) {
    return 'XLS';
  }

  return 'DOC';
};

const formatFileSize = (
  bytes
) => {
  if (!bytes) {
    return '0 KB';
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.round(
      bytes / 1024
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

const SelectedDocumentList = ({
  files,
  onRemove,
}) => {
  if (!files.length) {
    return null;
  }

  return (
    <div className="selected-document-list">
      <div className="selected-document-heading">
        <div>
          <h4>
            Supporting Documents
          </h4>

          <p>
            These documents will
            be sent to the expense
            processing service.
          </p>
        </div>

        <span>
          {files.length} files
        </span>
      </div>

      <div className="selected-document-items">
        {files.map(
          (file, index) => (
            <div
              className="selected-document"
              key={`${file.name}-${index}`}
            >
              <div className="document-file-icon">
                {getFileIcon(
                  file
                )}
              </div>

              <div className="document-file-info">
                <strong>
                  {file.name}
                </strong>

                <span>
                  {formatFileSize(
                    file.size
                  )}
                </span>
              </div>

              <div className="document-ready">
                Ready
              </div>

              <button
                type="button"
                className="document-remove"
                title="Remove document"
                onClick={() =>
                  onRemove(index)
                }
              >
                ×
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SelectedDocumentList;