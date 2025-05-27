import { Router } from "express";
import { User } from "../models/UserModel.js";
import { Player } from "../models/PlayerModel.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import fetch from 'node-fetch';
import * as functions from '../functions.js';

export const router = Router();

const sendLog = async (message, severity) => {
  try {
    const res = await fetch(`https://loggerapp-backend.onrender.com/api/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://kicknation-backend-5.onrender.com"
      },
      body: JSON.stringify({
        apiKey: "6c64ae497f4655d53e10b7f4eb710fa4",
        message: message,
        severity_level: severity,
      }),
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    console.log(data)
  } catch (error) {
    console.error("Failed to send log:", error.message);
  }
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, 'verySecretKey');
      req.user = await User.findOne({ username: decoded.username }).select('password');
      await sendLog(`User ${decoded.username} authorized successfully`, "info");
      next();
    } catch (err) {
      console.error(err);
      await sendLog(`Authorization failed: ${err.message}`, "err");
      res.status(404);
      throw new Error('Not authorized');
    }
  }
  if (!token) {
    await sendLog(`Authorization failed: No token provided`, "warning");
    res.status(401);
    throw new Error('No token');
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      await sendLog(`Login failed: Username ${username} not found`, "notice");
      return res.json({ message: "Wrong username or password" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await sendLog(`Login failed: Wrong password for username ${username}`, "notice");
      return res.json({ message: "Wrong username or password" });
    }
    const token = jwt.sign({ username: user.username }, 'verySecretKey', { expiresIn: '2h' });
    req.user = user;
    res.status(202).header('Authorization', `Bearer ${token}`).json({
      message: "Successful login",
      user: { username: user.username, clubName: user.clubName }
    });
    await sendLog(`User ${username} Logged In successfully`, "info")
  } catch (error) {
    console.error(error);
    await sendLog(`Login error for username ${username}: ${error.message}`, "err");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, password, clubName } = req.body;

    if (!username || !password || !clubName) {
      await sendLog("Registration failed: Missing input fields", "warning");
      return res.status(400).json({ message: "Input all fields" });
    }

    if (username.length < 6 || password.length < 6 || clubName.length < 6) {
      await sendLog(`Registration failed: Input lengths too short (username: ${username.length}, password: ${password.length}, clubName: ${clubName.length})`, "notice");
      return res.json({ message: "Minimal length of all inputs is 6" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      await sendLog(`Registration failed: Username ${username} already exists`, "notice");
      return res.json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const names = [];
    while (names.length < 11) {
      const newPlayerData = await Player.findOne({});
      await Player.deleteOne({ _id: newPlayerData._id });
      names.push(newPlayerData);
    }

    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };

    const newUser = {
      username,
      password: hashedPassword,
      clubName: capitalizeFirstLetter(clubName),
      squad: [
        { playerName: names[0].playerName, country: names[0].country, countryCode: names[0].countryCode, rating: 50, position: "GK" },
        { playerName: names[1].playerName, country: names[1].country, countryCode: names[1].countryCode, rating: 50, position: "DEF" },
        { playerName: names[2].playerName, country: names[2].country, countryCode: names[2].countryCode, rating: 50, position: "DEF" },
        { playerName: names[3].playerName, country: names[3].country, countryCode: names[3].countryCode, rating: 50, position: "DEF" },
        { playerName: names[4].playerName, country: names[4].country, countryCode: names[4].countryCode, rating: 50, position: "DEF" },
        { playerName: names[5].playerName, country: names[5].country, countryCode: names[5].countryCode, rating: 50, position: "MID" },
        { playerName: names[6].playerName, country: names[6].country, countryCode: names[6].countryCode, rating: 50, position: "MID" },
        { playerName: names[7].playerName, country: names[7].country, countryCode: names[7].countryCode, rating: 50, position: "MID" },
        { playerName: names[8].playerName, country: names[8].country, countryCode: names[8].countryCode, rating: 50, position: "ATT" },
        { playerName: names[9].playerName, country: names[9].country, countryCode: names[9].countryCode, rating: 50, position: "ATT" },
        { playerName: names[10].playerName, country: names[10].country, countryCode: names[10].countryCode, rating: 50, position: "ATT" },
      ]
    };

    const user = await User.create(newUser);

    if (user) {
      return res.status(201).json({ message: "Successful signup" });
    } else {
      await sendLog(`Registration failed: Could not save user ${username}`, "err");
      return res.status(500).json({ message: "There was a problem saving your data" });
    }
  } catch (error) {
    console.error(error);
    await sendLog(`Registration error: ${error.message}`, "err");
    return res.status(500).send({ message: error.message });
  }
});

router.get("/myTeam", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      await sendLog("myTeam request failed: Username is required", "warning");
      return res.status(400).json({ message: "Username is required" });
    }

    const currentUser = await User.findOne({ username });
    if (!currentUser || !currentUser.squad || currentUser.squad.length === 0) {
      await sendLog(`myTeam request failed: Squad not found for user ${username}`, "notice");
      return res.status(404).json({ message: "User's squad not found" });
    }

    res.status(200).json({ squad: currentUser.squad });
  } catch (error) {
    console.error(error);
    await sendLog(`myTeam error: ${error.message}`, "err");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const currentUser = await User.findOne({ _id: req.user._id });
    if (!currentUser) {
      await sendLog(`Profile request failed: User not found (_id: ${req.user._id})`, "notice");
      return res.status(404).json({ message: "User's data not found" });
    }

    res.status(200).json({ data: currentUser });
  } catch (error) {
    console.error(error);
    await sendLog(`Profile error: ${error.message}`, "err");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/buyPack", async (req, res) => {
  try {
    const { username } = req.query;
    const currentUser = await User.findOne({ username });
    if (!currentUser) {
      await sendLog(`buyPack failed: User ${username} not found`, "notice");
      return res.status(404).json({ message: "User's data not found" });
    }
    if (currentUser.money < 100) {
      await sendLog(`buyPack failed: Not enough money for user ${username}`, "notice");
      return res.json({ message: "Not enough money" });
    }

    currentUser.money -= 100;
    await currentUser.save();

    const names = [];
    while (names.length < 2) {
      const newPlayerData = await Player.findOne({});
      await Player.deleteOne({ _id: newPlayerData._id });
      newPlayerData.position = await functions.playerPosition();
      newPlayerData.rating = await functions.playerRating();
      names.push(newPlayerData);
    }

    const squad = [
      { playerName: names[0].playerName, country: names[0].country, countryCode: names[0].countryCode, rating: names[0].rating, position: names[0].position },
      { playerName: names[1].playerName, country: names[1].country, countryCode: names[1].countryCode, rating: names[1].rating, position: names[1].position }
    ];
    res.status(200).json({ squad });
  } catch (error) {
    console.error(error);
    await sendLog(`buyPack error: ${error.message}`, "err");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/getData', async (req, res) => {
  try {
    const { username } = req.query;
    const currentUser = await User.findOne({ username });

    if (!currentUser) {
      await sendLog(`getData failed: User ${username} not found`, "notice");
      return res.status(404).json({ message: "User's data not found" });
    }

    const formattedJoinDate = new Date(currentUser.joinDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');

    const [nationBonus, nations] = functions.calculateNationBonus(currentUser.squad);


    res.status(200).json({
      clubName: currentUser.clubName,
      money: currentUser.money,
      points: currentUser.points,
      joinDate: formattedJoinDate,
      nationBonus: nationBonus,
      nations: nations,
      ratingBonus: functions.calculateRatingBonus(currentUser.squad),
      positionBonus: functions.calculatePositionBonus(currentUser.squad)
    });
  } catch (error) {
    console.error(error);
    await sendLog(`getData error: ${error.message}`, "err");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/calculateBonusesWhenReplacing', async (req, res) => {
  try {
    const username = req.query.username;
    const oldPlayer = req.query.oldPlayer;
    const newPlayer = JSON.parse(req.query.newPlayer);
    const user = await User.findOne({ username });
    if (!user) {
      await sendLog(`calculateBonusesWhenReplacing failed: User ${username} not found`, "notice");
      return res.status(404).json({ message: "User not found" });
    }
    const currentUserSquad = user.squad;

    for (let i = 0; i < 11; i++) {
      if (currentUserSquad[i]._id.toString() === oldPlayer) {
        currentUserSquad[i] = newPlayer;
      }
    }


    res.status(200).json({
      nationBonus: functions.calculateNationBonus(currentUserSquad),
      ratingBonus: functions.calculateRatingBonus(currentUserSquad),
      positionBonus: functions.calculatePositionBonus(currentUserSquad)
    });
  } catch (error) {
    console.error(error);
    await sendLog(`calculateBonusesWhenReplacing error: ${error.message}`, "err");
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put('/replacePlayer', async (req, res) => {
  try {
    const { username, oldPlayerName, newPlayerName, newPlayerRating, newPlayerCountry, newPlayerCountryCode, newPlayerPosition } = req.body;
    if (!username || !oldPlayerName || !newPlayerName || !newPlayerRating || !newPlayerCountry || !newPlayerCountryCode || !newPlayerPosition) {
      await sendLog(`replacePlayer failed: Missing required fields`, "warning");
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newPlayer = {
      playerName: newPlayerName,
      country: newPlayerCountry,
      countryCode: newPlayerCountryCode,
      rating: newPlayerRating,
      position: newPlayerPosition
    }

    const user = await User.findOne({ username });
    if (!user) {
      await sendLog(`replacePlayer failed: User ${username} not found`, "notice");
      return res.status(404).json({ message: "User not found" });
    }
    const squad = user.squad;

    const index = squad.findIndex(p => p.playerName.toString() === oldPlayerName);
    if (index === -1) {
      await sendLog(`replacePlayer failed: Old player not found in squad for user ${username}`, "notice");
      return res.status(404).json({ message: "Old player not found in squad" });
    }

    squad[index] = newPlayer;
    user.squad = squad;
    await user.save();


    res.status(200).json({ message: "Successful replacement" });
  } catch (error) {
    console.error(error);
    await sendLog(`replacePlayer error: ${error.message}`, "err");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
