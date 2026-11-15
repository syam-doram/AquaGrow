import express from 'express';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { createStaff, listStaff, getStaff, updateStaff, deactivateStaff } from '../controllers/staffController.js';

const router = express.Router();

// All staff management endpoints require owner privileges
router.post('/', authenticate, requireOwner, createStaff);
router.get('/', authenticate, requireOwner, listStaff);
router.get('/:id', authenticate, requireOwner, getStaff);
router.put('/:id', authenticate, requireOwner, updateStaff);
router.delete('/:id', authenticate, requireOwner, deactivateStaff); // soft delete

export default router;
