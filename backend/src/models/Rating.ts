import { Schema, model, Document, Types } from 'mongoose';

export interface IRating extends Document {
  user: Types.ObjectId;
  movie: Types.ObjectId;
  movieId: number;
  rating: number;
  title: string;
  genres: string[];
}

const RatingSchema = new Schema<IRating>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    movieId: { type: Number, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    genres: [{ type: String }],
  },
  { timestamps: true }
);

RatingSchema.index({ user: 1, movie: 1 }, { unique: true });

export const Rating = model<IRating>('Rating', RatingSchema);
