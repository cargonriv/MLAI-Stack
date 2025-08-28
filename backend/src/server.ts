import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import movieRoutes from './routes/movies.routes';
import recommendationRoutes from './routes/recommendations.routes';
import CollaborativeFilteringEngine from './utils/collaborativeFiltering';
import { modelManager } from './utils/modelManager';

const app = express();
const PORT = process.env.PORT || 5001;

const engine = new CollaborativeFilteringEngine(modelManager);

const startServer = async () => {
  try {
    await connectDB();
    await engine.initialize(); // Initialize the engine and load movies

    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/movies', movieRoutes);
    app.use('/api/recommendations', recommendationRoutes);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
