import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', getSettings);
router.post('/', updateSettings);
router.put('/', updateSettings);

export default router;
