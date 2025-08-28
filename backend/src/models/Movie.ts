import { Schema, model, Document } from 'mongoose';

export interface IMovie extends Document {
  id: number;
  imdbID: string;
  title: string;
  genres: string[];
  year: number;
  averageRating: number;
  ratingCount: number;
}

const MovieSchema = new Schema<IMovie>({
  id: { type: Number, required: true, unique: true },
  imdbID: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  genres: [{ type: String }],
  year: { type: Number },
  averageRating: { type: Number },
  ratingCount: { type: Number },
});

export const Movie = model<IMovie>('Movie', MovieSchema);
