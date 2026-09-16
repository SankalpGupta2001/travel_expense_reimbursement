import {
  getApiBaseUrl,
} from './api.js';


/*
|--------------------------------------------------------------------------
| Process Expenses
|--------------------------------------------------------------------------
*/

export const processExpenses = async ({
  travelRequestId,
  files = [],
}) => {
  if (!travelRequestId) {
    throw new Error(
      'Travel Request ID is required.'
    );
  }


  const formData =
    new FormData();


  formData.append(
    'travelRequestId',
    travelRequestId
  );


  /*
   * Files are optional.
   *
   * If there are no files, only the
   * Travel Request ID is sent.
   */
  files.forEach((file) => {
    formData.append(
      'documents',
      file
    );
  });


  const response =
    await fetch(
      `${getApiBaseUrl()}/expenses/process`,
      {
        method: 'POST',
        body: formData,
      }
    );


  const result =
    await response
      .json()
      .catch(() => ({}));


  console.log(
    'POST /expenses/process:',
    response.status,
    result
  );


  if (!response.ok) {
    throw new Error(
      result?.message ||
      'Failed to process expenses'
    );
  }


  return result;
};


/*
|--------------------------------------------------------------------------
| Settlement Form Download URL
|--------------------------------------------------------------------------
*/

export const getSettlementDownloadUrl = (
  downloadUrl
) => {
  if (!downloadUrl) {
    return null;
  }


  /*
   * If backend already returned a complete URL,
   * use it directly.
   */
  if (
    downloadUrl.startsWith('http://') ||
    downloadUrl.startsWith('https://')
  ) {
    return downloadUrl;
  }


  /*
   * Example backend URL:
   *
   * /api/expenses/download/TRQ-2026-0001_Expense_Settlement.xlsx
   *
   * API base:
   *
   * http://localhost:5000/api
   *
   * We need:
   *
   * http://localhost:5000
   */
  const baseUrl =
    getApiBaseUrl().replace(
      /\/api\/?$/,
      ''
    );


  /*
   * Make sure there is exactly one slash.
   */
  const normalizedPath =
    downloadUrl.startsWith('/')
      ? downloadUrl
      : `/${downloadUrl}`;


  return `${baseUrl}${normalizedPath}`;
};