import {
  createTravelRequest,
  getTravelRequests,
  getTravelRequestById,
  resubmitTravelRequest,
} from '../services/travel-request.service.js';


/**
 * Create a new Travel Request.
 */
export const createRequest = async (
  req,
  res,
  next
) => {
  try {

    const request =
      await createTravelRequest(
        req.body
      );

    return res.status(201).json({
      success: true,

      message:
        'Travel Request created successfully',

      data: request,
    });

  } catch (error) {

    next(error);

  }
};


/**
 * Get all Travel Requests.
 */
export const getRequests = async (
  req,
  res,
  next
) => {
  try {

    const requests =
      await getTravelRequests();

    return res.status(200).json({
      success: true,
      data: requests,
    });

  } catch (error) {

    next(error);

  }
};


/**
 * Get a single Travel Request.
 */
export const getRequest = async (
  req,
  res,
  next
) => {
  try {

    const {
      travelRequestId,
    } = req.params;

    const request =
      await getTravelRequestById(
        travelRequestId
      );

    if (!request) {

      return res.status(404).json({
        success: false,

        message:
          'Travel Request not found',
      });

    }

    return res.status(200).json({
      success: true,
      data: request,
    });

  } catch (error) {

    next(error);

  }
};


/**
 * Resubmit a Travel Request that was
 * returned by Manager / HOD / another
 * approval authority.
 *
 * This updates the SAME Travel Request.
 */
export const resubmitRequest = async (
  req,
  res,
  next
) => {
  try {

    const {
      travelRequestId,
    } = req.params;

    const request =
      await resubmitTravelRequest(
        travelRequestId,
        req.body
      );

    return res.status(200).json({
      success: true,

      message:
        'Travel Request corrected and resubmitted successfully',

      data: request,
    });

  } catch (error) {

    next(error);

  }
};