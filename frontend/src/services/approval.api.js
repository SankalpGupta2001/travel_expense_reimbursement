const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';


const parseResponse = async (
  response
) => {

  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.error ||
      `Request failed with status ${response.status}`
    );

  }


  return data;

};


/**
 * Get approvals assigned
 * to the current employee.
 */
export const getPendingApprovals =
  async (
    employeeCode
  ) => {

    const response =
      await fetch(
        `${API_BASE_URL}/approvals/pending?employeeCode=${encodeURIComponent(
          employeeCode
        )}`,
        {
          method: 'GET',
          headers: {
            Accept:
              'application/json',
          },
        }
      );


    return parseResponse(
      response
    );

  };


/**
 * Approve a Travel Request.
 */
export const approveTravelRequest =
  async (
    travelRequestId,
    employeeCode,
    remarks = ''
  ) => {

    const response =
      await fetch(
        `${API_BASE_URL}/approvals/${encodeURIComponent(
          travelRequestId
        )}/approve`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },

          body: JSON.stringify({
            employeeCode,
            remarks,
          }),
        }
      );


    return parseResponse(
      response
    );

  };


/**
 * Return a Travel Request.
 */
export const returnTravelRequest =
  async (
    travelRequestId,
    employeeCode,
    remarks
  ) => {

    const response =
      await fetch(
        `${API_BASE_URL}/approvals/${encodeURIComponent(
          travelRequestId
        )}/return`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },

          body: JSON.stringify({
            employeeCode,
            remarks,
          }),
        }
      );


    return parseResponse(
      response
    );

  };