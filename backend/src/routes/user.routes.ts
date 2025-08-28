import { Router } from 'express';
import { getProfile, updateProfile, addRating } from '../controllers/user.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/ratings', auth, addRating);

export default router;
