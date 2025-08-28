import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendations.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', auth, getRecommendations);

export default router;
