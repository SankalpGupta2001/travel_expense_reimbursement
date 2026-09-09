const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

export const processExpensePack =
  async () => {
    const response = await fetch(
      `${API_BASE_URL}/expenses/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData =
        await response
          .json()
          .catch(() => ({}));

      throw new Error(
        errorData.message ||
        'Failed to process expense pack'
      );
    }

    return response.json();
  };

export const getSettlementDownloadUrl =
  (downloadUrl) => {
    if (!downloadUrl) {
      return null;
    }

    const backendBaseUrl =
      API_BASE_URL.replace(
        /\/api\/?$/,
        ''
      );

    return `${backendBaseUrl}${downloadUrl}`;
  };
