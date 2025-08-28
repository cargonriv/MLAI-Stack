import { Router } from 'express';
import { getAllMovies } from '../controllers/movies.controller';

const router = Router();

router.get('/', getAllMovies);

export default router;
