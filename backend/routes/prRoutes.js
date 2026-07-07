import express from 'express';
import { 
  getPRs, 
  getPRById, 
  addPRDependency, 
  deletePRDependency, 
  syncRepos 
} from '../controllers/prController.js';

const router = express.Router();

router.get('/', getPRs);
router.post('/sync', syncRepos);
router.get('/:id', getPRById);
router.post('/:id/dependencies', addPRDependency);
router.delete('/:id/dependencies/:depId', deletePRDependency);

export default router;
