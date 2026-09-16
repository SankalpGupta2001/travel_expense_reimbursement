const API_BASE_URL =
  'http://localhost:5000/api';


/*
|--------------------------------------------------------------------------
| PARSE API RESPONSE
|--------------------------------------------------------------------------
*/

const parseResponse = async (
  response
) => {

  const text =
    await response.text();


  let data = null;


  try {

    data =
      text
        ? JSON.parse(text)
        : null;

  } catch {

    data = {
      message: text,
    };

  }


  if (!response.ok) {

    throw new Error(
      data?.message ||
      `Request failed with status ${response.status}`
    );

  }


  return data;
};


/*
|--------------------------------------------------------------------------
| GET FINANCE CLAIMS
|--------------------------------------------------------------------------
*/

export const getFinanceClaims =
  async () => {

    const response =
      await fetch(
        `${API_BASE_URL}/finance/claims`
      );


    return parseResponse(
      response
    );

  };


/*
|--------------------------------------------------------------------------
| GET ONE FINANCE CLAIM
|--------------------------------------------------------------------------
*/

export const getFinanceClaim =
  async (
    travelRequestId
  ) => {

    if (!travelRequestId) {

      throw new Error(
        'Travel Request ID is required.'
      );

    }


    const response =
      await fetch(
        `${API_BASE_URL}/finance/claims/${encodeURIComponent(
          travelRequestId
        )}`
      );


    return parseResponse(
      response
    );

  };


/*
|--------------------------------------------------------------------------
| VERIFY FINANCE CLAIM
|--------------------------------------------------------------------------
*/

export const verifyFinanceClaim =
  async (
    travelRequestId,
    employeeCode
  ) => {

    if (!travelRequestId) {

      throw new Error(
        'Travel Request ID is required.'
      );

    }


    if (!employeeCode) {

      throw new Error(
        'Finance employee code is required.'
      );

    }


    const response =
      await fetch(
        `${API_BASE_URL}/finance/claims/${encodeURIComponent(
          travelRequestId
        )}/verify`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            employeeCode,
          }),
        }
      );


    return parseResponse(
      response
    );

  };


/*
|--------------------------------------------------------------------------
| RETURN FINANCE CLAIM
|--------------------------------------------------------------------------
*/

export const returnFinanceClaim =
  async (
    travelRequestId,
    employeeCode,
    remarks
  ) => {

    if (!travelRequestId) {

      throw new Error(
        'Travel Request ID is required.'
      );

    }


    if (!employeeCode) {

      throw new Error(
        'Finance employee code is required.'
      );

    }


    if (!remarks?.trim()) {

      throw new Error(
        'Return remarks are required.'
      );

    }


    const response =
      await fetch(
        `${API_BASE_URL}/finance/claims/${encodeURIComponent(
          travelRequestId
        )}/return`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            employeeCode,

            remarks:
              remarks.trim(),
          }),
        }
      );


    return parseResponse(
      response
    );

  };


/*
|--------------------------------------------------------------------------
| RELEASE PAYOUT
|--------------------------------------------------------------------------
*/

export const createPayout =
  async (
    travelRequestId,
    employeeCode
  ) => {

    if (!travelRequestId) {

      throw new Error(
        'Travel Request ID is required.'
      );

    }


    if (!employeeCode) {

      throw new Error(
        'Finance employee code is required.'
      );

    }


    const response =
      await fetch(
        `${API_BASE_URL}/finance/claims/${encodeURIComponent(
          travelRequestId
        )}/payout`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            employeeCode,
          }),
        }
      );


    return parseResponse(
      response
    );

  };


/*
|--------------------------------------------------------------------------
| SETTLEMENT FORM DOWNLOAD URL
|--------------------------------------------------------------------------
*/

export const getSettlementDownloadUrl =
  (
    downloadUrl
  ) => {

    if (!downloadUrl) {
      return '';
    }


    /*
     * Backend already returned
     * an absolute URL.
     */

    if (
      downloadUrl.startsWith(
        'http://'
      ) ||
      downloadUrl.startsWith(
        'https://'
      )
    ) {

      return downloadUrl;

    }


    /*
     * Backend returned a relative path.
     *
     * Example:
     * /api/finance/settlements/...
     */

    return `${API_BASE_URL.replace(
      '/api',
      ''
    )}${downloadUrl}`;

  };