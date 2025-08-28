import { Request, Response } from 'express';
import { Movie } from '../models/Movie';

export const getAllMovies = async (req: Request, res: Response) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
