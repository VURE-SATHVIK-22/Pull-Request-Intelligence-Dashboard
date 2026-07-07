import express from 'express';
import { generatePRSummary } from '../controllers/aiController.js';

const router = express.Router();

router.post('/:id/summarize', generatePRSummary);

export default router;
