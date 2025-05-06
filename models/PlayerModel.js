import mongoose from 'mongoose';
const { Schema } = mongoose;

const playerSchema = new Schema({
  playerName: { type: String },
  country: { type: String },
  countryCode: {type: String},
  rating: { type: Number },
  position: {type: String}
});

export const Player = mongoose.model ('Player', playerSchema, 'players')