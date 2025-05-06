import mongoose from 'mongoose';
const { Schema } = mongoose;

const playerSchema = new Schema({
  playerName: { type: String },
  country: { type: String },
  countryCode: {type: String},
  rating: { type: Number },
  position: {type: String}
});


const userSchema = new Schema({
  username: {type: String, required: true, minlength: 6}, 
  password: {type: String, required: true, minlength: 6},
  clubName: {type: String, required: true, minlength: 6},
  tournament: {type: Number, default: 0},
  eighthFinals: {type: Array},
  quarterFinals: {type: Array},
  semiFinals: {type: Array},
  finale: {type: Array},
  points: {type: Number, default: 0},
  money: {type: Number, default: 700},
  joinDate: {type: Date, default: Date.now()},
  squad: [playerSchema]
});

export const User = mongoose.model ('User', userSchema, 'users')