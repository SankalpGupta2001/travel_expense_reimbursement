import {
  useRef,
  useState,
} from 'react';

const DocumentUpload = ({
  files,
  onFilesSelected,
}) => {
  const inputRef =
    useRef(null);

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const processFiles = (
    selectedFiles
  ) => {
    const fileArray =
      Array.from(
        selectedFiles || []
      );

    if (!fileArray.length) {
      return;
    }

    onFilesSelected(
      fileArray
    );
  };

  const handleInputChange = (
    event
  ) => {
    processFiles(
      event.target.files
    );

    event.target.value = '';
  };

  const handleDrop = (
    event
  ) => {
    event.preventDefault();

    setDragging(false);

    processFiles(
      event.dataTransfer.files
    );
  };

  return (
    <div className="document-upload-wrapper">
      <div
        className={`document-dropzone ${
          dragging
            ? 'dragging'
            : ''
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() =>
          inputRef.current?.click()
        }
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={
            handleInputChange
          }
        />

        <div className="upload-icon">
          ↑
        </div>

        <h3>
          Upload expense documents
        </h3>

        <p>
          Drag and drop receipts,
          invoices, tickets or
          supporting emails here
        </p>

        <button
          type="button"
          className="button secondary"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse Files
        </button>

        <small>
          PDF, PNG, JPG and JPEG · Multiple files supported
        </small>
      </div>

      {files.length > 0 && (
        <div className="document-count">
          <span>
            {files.length} document
            {files.length !== 1
              ? 's'
              : ''}{' '}
            selected
          </span>

          <span>
            Ready for processing
          </span>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;