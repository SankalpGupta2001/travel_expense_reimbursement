import {
  apiGet,
  apiPost,
} from './api.js';


export const getTravelRequests =
  async () =>
    (
      await apiGet(
        '/travel-requests'
      )
    ).data || [];



export const getTravelRequest =
  async (id) =>
    (
      await apiGet(
        `/travel-requests/${encodeURIComponent(
          id
        )}`
      )
    ).data;


export const createTravelRequest =
  async (payload) =>
    (
      await apiPost(
        '/travel-requests',
        payload
      )
    ).data;


/*
 * Resubmit an existing Travel Request
 * after Manager / HOD has returned it.
 *
 * IMPORTANT:
 * This does NOT create a new TRQ.
 */
export const resubmitTravelRequest =
  async (
    id,
    payload
  ) =>
    (
      await apiPost(
        `/travel-requests/${encodeURIComponent(
          id
        )}/resubmit`,
        payload
      )
    ).data;


export const getMyTravelRequests =
  async (employeeCode) => {

    const requests =
      await getTravelRequests();

    return requests.filter(
      (request) =>
        request.employeeDetails
          ?.employeeCode ===
        employeeCode
    );

  };
