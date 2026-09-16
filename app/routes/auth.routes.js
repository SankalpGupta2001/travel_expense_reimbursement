import express from 'express';

import {
  getUsers,
  login,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/api/auth/users', getUsers);
router.post('/api/auth/login', login);

export default router;
