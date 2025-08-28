import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Rating } from '../models/Rating';
import { Movie } from '../models/Movie';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const ratings = await Rating.find({ user: req.userId });
    res.json({ user, ratings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addRating = async (req: AuthRequest, res: Response) => {
  const { movieId, rating } = req.body;
  try {
    const movie = await Movie.findOne({ id: movieId });
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const newRating = {
        user: req.userId,
        movie: movie._id,
        movieId: movie.id,
        rating,
        title: movie.title,
        genres: movie.genres
    }

    const ratingDoc = await Rating.findOneAndUpdate(
        { user: req.userId, movie: movie._id },
        newRating,
        { upsert: true, new: true }
    );

    res.status(201).json(ratingDoc);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
