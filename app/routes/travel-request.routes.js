import express from 'express';

import {
  createRequest,
  getRequests,
  getRequest,
  resubmitRequest,
} from '../controllers/travel-request.controller.js';

const router =
  express.Router();


router.post(
  '/api/travel-requests',
  createRequest
);


router.get(
  '/api/travel-requests',
  getRequests
);


router.get(
  '/api/travel-requests/:travelRequestId',
  getRequest
);


/*
 * IMPORTANT:
 * Keep this BEFORE any generic
 * /:travelRequestId route if your
 * router structure requires ordering.
 */
router.post(
  '/api/travel-requests/:travelRequestId/resubmit',
  resubmitRequest
);


export default router;
