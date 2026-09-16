import express from 'express';

import {
  getPending,
  approve,
  returnRequest,
} from '../controllers/approval.controller.js';

const router = express.Router();

router.get(
  '/api/approvals/pending',
  getPending
);

router.post(
  '/api/approvals/:travelRequestId/approve',
  approve
);

router.post(
  '/api/approvals/:travelRequestId/return',
  returnRequest
);

export default router;