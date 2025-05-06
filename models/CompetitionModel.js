import mongoose from 'mongoose';
const { Schema } = mongoose;

const matchesSchema = new Schema({
    tournament:{ type: Number },
    teams: { type: String },
    rating: { type: Number },
    position: {type: String}
  });