import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import CollaborativeFilteringEngine from '../utils/collaborativeFiltering';
import { modelManager } from '../utils/modelManager';
import { Types } from 'mongoose';

const engine = new CollaborativeFilteringEngine(modelManager);

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
        return res.status(400).json({ message: 'User not found' });
    }
    // await engine.initialize();
    const userId = new Types.ObjectId(req.userId);
    const recommendations = await engine.generateRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
