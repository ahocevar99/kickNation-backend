import { Router } from "express";
import { User } from "../models/UserModel.js";
import { Player } from "../models/PlayerModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import fetch from 'node-fetch';
import * as functions from '../functions.js';
export const router = Router();



const protect = asyncHandler (async (req,res,next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith ('Bearer')){
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, 'verySecretKey')
      req.user = await User.findOne({ username: decoded.username }).select ('password')
      next()
    } catch (err){
      console.log (err)
      res.status (404)
      throw new Error ('Not authorized')
    }
  }
  if (!token){
    res.status(401)
    throw new Error ('No token')
  }
})

router.post("/login", (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username }).then((user) => {
      if (user) {
        bcrypt.compare(password, user.password, (err, response) => {
          if (err) {
            res.json("Wrong username or password");
          } else if (response) {
            const token = jwt.sign ({
                username: user.username
            }, 'verySecretKey', {expiresIn: '2h'})

            req.user = user;
            res.status(202).header('Authorization', `Bearer ${token}`).json({ message: "Successful login", user: { username: user.username, clubName: user.clubName } });
          } else {
            res.json("Wrong username or password");
          }
        });
      } else {
        res.json("Wrong username or password");
      }
    });
  });

router.post("/register", async (req, res) => {
  try {
    if (!req.body.username || !req.body.password || !req.body.clubName) {
      return res.status(400).send("Input all fields");
    }
    if (
      req.body.username.length < 6 ||
      req.body.password.length < 6 ||
      req.body.clubName.length < 6
    ) {
      return res.send("Minimal lentgh of all inputs is 6");
    }
    const existingUser = await User.findOne({ username: req.body.username });

    if (existingUser) {
      return res.send('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    const names = [];
    
    while (names.length < 11) {
      const newPlayerData = await Player.findOne({});
      await Player.deleteOne({_id : newPlayerData._id})
      names.push(newPlayerData);
    }

    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };

    const newUser = {
      username: req.body.username,
      password: hashedPassword,
      clubName: capitalizeFirstLetter(req.body.clubName), 
      squad: [
        {playerName: names[0].playerName, country: names[0].country, countryCode: names[0].countryCode, rating: 50, position: "GK"},
        {playerName: names[1].playerName, country: names[1].country, countryCode: names[1].countryCode, rating: 50, position: "DEF"},
        {playerName: names[2].playerName, country: names[2].country, countryCode: names[2].countryCode,rating: 50, position: "DEF"},
        {playerName: names[3].playerName, country: names[3].country, countryCode: names[3].countryCode,rating: 50, position: "DEF"},
        {playerName: names[4].playerName, country: names[4].country, countryCode: names[4].countryCode,rating: 50, position: "DEF"},
        {playerName: names[5].playerName, country: names[5].country, countryCode: names[5].countryCode,rating: 50, position: "MID"},
        {playerName: names[6].playerName, country: names[6].country, countryCode: names[6].countryCode,rating: 50, position: "MID"},
        {playerName: names[7].playerName, country: names[7].country, countryCode: names[7].countryCode,rating: 50, position: "MID"},
        {playerName: names[8].playerName, country: names[8].country, countryCode: names[8].countryCode,rating: 50, position: "ATT"},
        {playerName: names[9].playerName, country: names[9].country, countryCode: names[9].countryCode,rating: 50, position: "ATT"},
        {playerName: names[10].playerName, country: names[10].country, countryCode: names[10].countryCode,rating: 50, position: "ATT"},
      ]
    };
    const user = await User.create(newUser);
    if (user) {
      return res.status(201).json({message: "Successful signup"});
    } else {
      return res.status(500).json({message: "There was a problem saving your data"});
    }
    
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ message: error.message });
  }
});

router.get("/myTeam", async (req, res) => {
  try {
    const { username } = req.query; // Uporabimo query parameter
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const currentUser = await User.findOne({ username });
    if (!currentUser || !currentUser.squad || currentUser.squad.length === 0) {
      return res.status(404).json({ message: "User's squad not found" });
    }
    
    res.status(200).json({ squad: currentUser.squad });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get ("/profile", async (req,res) => {
  try {
    const currentUser = await User.findOne({ _id: req.user._id });
    if (!currentUser) {
      return res.status(404).json({ message: "User's data not found" });
    }

    res.status(200).json({ data: currentUser});
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get ("/buyPack", async (req,res) => {
  try {
    const { username } = req.query; 
    const currentUser = await User.findOne({ username });
    if (!currentUser) {
      return res.status(404).json({ message: "User's data not found" });
    }
    if (currentUser.money < 100) {
      return res.json({ message: "Not enough money" });
    }
    currentUser.money -= 100;
    await currentUser.save();
    const names = [];
    while (names.length < 2) {
      const newPlayerData = await Player.findOne({})
      await Player.deleteOne({_id : newPlayerData._id})
      newPlayerData.position = await functions.playerPosition();
      newPlayerData.rating = await functions.playerRating();
      names.push(newPlayerData);
    }
    
    var squad = [
      { playerName: names[0].playerName, country: names[0].country, countryCode: names[0].countryCode, rating: names[0].rating, position: names[0].position },
      { playerName: names[1].playerName, country: names[1].country, countryCode: names[1].countryCode,rating: names[1].rating, position: names[1].position }
    ];
    res.status (200).json({squad: squad})
    
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/getData', async (req, res) => {
  try {
    const { username } = req.query;
    const currentUser = await User.findOne({ username });

    if (!currentUser) {
      return res.status(404).json({ message: "User's data not found" });
    }

    // Format the joinDate to 'day.month.year'
    const formattedJoinDate = new Date(currentUser.joinDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
    const [nationBonus, nations] = functions.calculateNationBonus(currentUser.squad)
    res.status(200).json({
      clubName: currentUser.clubName,
      money: currentUser.money,
      points: currentUser.points,
      joinDate: formattedJoinDate, // Use the formatted date
      nationBonus: nationBonus,
      nations: nations,
      ratingBonus: functions.calculateRatingBonus(currentUser.squad),
      positionBonus: functions.calculatePositionBonus(currentUser.squad)
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/calculateBonusesWhenReplacing', async (req,res) => {
  try {
    const username = req.query.username;
    const oldPlayer = req.query.oldPlayer;
    const newPlayer = JSON.parse(req.query.newPlayer)
    const user = await User.findOne({username})
    const currentUserSquad = user.squad;
    for (let i = 0; i<11; i++) {
      if (currentUserSquad[i]._id.toString() === oldPlayer) {
        currentUserSquad[i] = newPlayer
      }
    }
    res.status(200).json({nationBonus: functions.calculateNationBonus(currentUserSquad),
      ratingBonus: functions.calculateRatingBonus(currentUserSquad), 
      positionBonus: functions.calculatePositionBonus(currentUserSquad)
    })
  }catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
})

router.put('/replacePlayer', async (req, res) => {
  try {
    const { username, oldPlayerName, newPlayerName, newPlayerRating, newPlayerCountry, newPlayerCountryCode, newPlayerPosition } = req.body;
    
    const currentUser = await User.findOne({ username });
    if (!currentUser || !currentUser.squad || currentUser.squad.length === 0) {
      return res.status(404).json({ message: "User's squad not found" });
    }
    
    // Find the index of the player by their name
    const index = currentUser.squad.findIndex(player => player.playerName === oldPlayerName);

    if (index === -1) {
      return res.status(404).json({ message: "Old player not found in squad" });
    }

    // Update the player's details
    currentUser.squad[index].playerName = newPlayerName;
    currentUser.squad[index].rating = newPlayerRating;
    currentUser.squad[index].country = newPlayerCountry;
    currentUser.squad[index].countryCode = newPlayerCountryCode;
    currentUser.squad[index].position = newPlayerPosition;
    
    await currentUser.save();

    return res.status(200).json({ message: "Player replaced successfully", squad: currentUser.squad });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/getPlayers", async (req, res) => {
  try {
    const { username } = req.query;
    const currentUser = await User.findOne({ username });
    if (!currentUser) {
      return res.status(404).json({ message: "User's data not found" });
    }
    // Preverite, ali vrnete podatke o igralcih
    res.status(200).json({ squad: currentUser.squad });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/getTournamentData", async (req, res) => {
  try {
      const { username, tournamentStage } = req.query;

      // Najdi trenutnega uporabnika
      const currentUser = await User.findOne({ username });
      if (!currentUser) {
          return res.status(404).json({ message: "User's data not found" });
      }

      // Najdi vse uporabnike v istem turnirju
      const tournamentUsers = await User.find({ tournament: currentUser.tournament });

      let stageKey;
      switch(tournamentStage) {
          case 'RoundOf16':
              stageKey = 'eighthFinals';
              break;
          case 'QuarterFinals':
              stageKey = 'quarterFinals';
              break;
          case 'SemiFinals':
              stageKey = 'semiFinals';
              break;
          case 'Finale':
              stageKey = 'finale';
              break;
          default:
              return res.status(400).json({ message: "Invalid tournament stage" });
      }

      // Ustvari pare za dano stopnjo
      const stageMatches = tournamentUsers.map(user => ({
          username: user.username,
          score: user[stageKey]
      }));

      // Filtriraj uporabnike z neprazno tabelo rezultatov
      const filteredMatches = stageMatches.filter(match => match.score.length > 0);

      // Ugotovi indeks uporabnika
      const userMatch = filteredMatches.find(match => match.username === username);
      const userIndex = userMatch ? userMatch.score[0] : null;

      // Razvrsti uporabnike po indeksih
      const indexGroups = {};
      filteredMatches.forEach(match => {
          const index = match.score[0]; // Uporabi prvi element za indeks
          if (!indexGroups[index]) {
              indexGroups[index] = [];
          }
          indexGroups[index].push(match);
      });

      // Ustvari končni seznam
      const finalMatches = [];

      // Dodaj par z uporabnikom na vrh
      if (userIndex !== null && indexGroups[userIndex]) {
          const userPairs = indexGroups[userIndex].splice(0, 2); // Dodaj do dva para z enakim indeksom
          finalMatches.push(...userPairs);
          delete indexGroups[userIndex]; // Odstrani ta indeks iz skupin
      }

      // Dodaj ostale pare
      const remainingMatches = Object.values(indexGroups).flat();

      // Ustvari pare po 2
      for (let i = 0; i < remainingMatches.length; i += 2) {
          const pair = remainingMatches.slice(i, i + 2);
          finalMatches.push(...pair);
      }

      // Vrni urejene pare
      return res.json(finalMatches);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
  }
});









export default router;