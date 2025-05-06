import { User } from "./models/UserModel.js";
import { createClub, playerRating, shuffleArray } from "./functions.js";
import footballClubs from "./clubNames.js";
export const matchResult = async (home, away) => {
  //notri dobiš postave
  let homeScore = 0;
  let awayScore = 0;
  let maxHomeAtt = 0;
  let maxAwayAtt= 0;
  let worstHomeDef = 99;
  let worstAwayDef = 99;
  home.forEach((player) => {
    if (player.position == "GK" || player.position == "DEF") {
      awayScore-=player.rating;
      if (player.rating<worstHomeDef) worstHomeDef = player.rating;
    }
    if (player.position == "MID") {
      awayScore-=player.rating*1.2;
      homeScore+=player.rating*1.2;
    }
    if (player.position == "ATT") {
      homeScore+=player.rating;
      if (player.rating>maxHomeAtt) maxHomeAtt = player.rating;
    }
  });
  away.forEach((player) => {
    if (player.position == "GK" || player.position == "DEF") {
      homeScore-=player.rating;
      if (player.rating<worstAwayDef) worstAwayDef = player.rating;
    }
    if (player.position == "MID") {
      homeScore-=player.rating*1.2;
      awayScore+=player.rating*1.2;
    }
    if (player.position == "ATT") {
      awayScore+=player.rating;
      if (player.rating>maxAwayAtt) maxAwayAtt = player.rating;
    }
  });
  homeScore+=maxHomeAtt+(99-worstAwayDef);
  awayScore+=maxAwayAtt+(99-worstHomeDef);
  

  // Dodajanje naključnih vrednosti
  homeScore += Math.random() * 100 - Math.random() * 50;
  awayScore += Math.random() * 100 - Math.random() * 50;
  while (Math.round(homeScore * 0.05) == Math.round(awayScore * 0.05)) {
    homeScore -= Math.random() * 50 + Math.random() * 100;
    awayScore -= Math.random() * 50 + Math.random() * 100;
  }

  // Zaokroževanje rezultatov
  homeScore *= 0.05;
  awayScore *= 0.05;
  homeScore = Math.round(homeScore);
  awayScore = Math.round(awayScore);

  // Preverjanje, da ni manjši od nič
  if (homeScore < 0) homeScore = 0;
  if (awayScore < 0) awayScore = 0;

  if (homeScore == -0 || homeScore==null) homeScore=0;
  if (awayScore == -0 || awayScore==null) awayScore=0;
  while (homeScore == awayScore) {
    homeScore = Math.round(Math.random());
    awayScore = Math.round(Math.random());
  }
  let finalScore = []
  finalScore.push(homeScore)
  finalScore.push(awayScore)
  return finalScore;
};

export const startTournament = async () => {
  try {
    getDailyMoney()
    let userCount = await User.countDocuments({});
    let i = 0;
    while (userCount % 16 != 0) {
      await createClub(footballClubs[i]);
      i++;
      userCount = await User.countDocuments({});
    }
    if (userCount % 16 === 0) {
      try {
        const users = await User.find({}).exec();
        const shuffledUsers = await shuffleArray(users);
        for (let i = 0; i < shuffledUsers.length; i++) {
          const groupIndex = Math.floor(i / 16) + 1;
          const groupPosition = i % 16;
          const pairIndex = Math.floor(groupPosition / 2) + 1;
          shuffledUsers[i].tournament = groupIndex;
          shuffledUsers[i].eighthFinals = [];
          shuffledUsers[i].quarterFinals = [];
          shuffledUsers[i].semiFinals = [];
          shuffledUsers[i].finale = [];

          shuffledUsers[i].eighthFinals.push(pairIndex);
          try {
            await shuffledUsers[i].save();
          } catch (error) {
            console.error("Error saving user.", error);
          }
        }
        console.log("Tournament created.");
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const eighthFinals = async () => {
  console.log ("------EIGHTH FINALS------")
  const users = await User.find({}).exec();
  users.sort((a, b) => a.tournament - b.tournament);
  for (let i = 0; i < users.length; i += 16) {
    var tournament = [];
    for (let j = 0; j < 16; j++) {
      tournament.push(users[i + j]);
    }
    tournament.sort((a, b) => a.eighthFinals[0] - b.eighthFinals[0]);
    let winners = [];
    for (let k = 0; k < 16; k += 2) {
      var result = await matchResult(
        tournament[k].squad,
        tournament[k + 1].squad
      );
      
      console.log(tournament[k].clubName+" - "+tournament[k+1].clubName+" = "+result[0]+" - "+result[1]);
      if (result[0]>result[1]) {
        winners.push(tournament[k])
      }
      else winners.push(tournament[k+1])
      tournament[k].eighthFinals.push(result[0]);
      tournament[k].eighthFinals.push(result[1]);
      tournament[k + 1].eighthFinals.push(result[1]);
      tournament[k + 1].eighthFinals.push(result[0]);
      try {
        await tournament[k].save();
        await tournament[k + 1].save();
      } catch (error) {
        console.error("Error saving users.", error);
      }
    }
    winners = await shuffleArray(winners);
    
    for (let j = 0; j<winners.length; j++){
      winners[j].quarterFinals = []
      winners[j].quarterFinals.push(Math.floor(j / 2) + 1)
      winners[j].quarterFinals.push(0)
      winners[j].quarterFinals.push(0)
      await winners[j].save();
    }
  }
};

export const quarterFinals = async () => {
  console.log ("------QUARTER FINALS------")
  const users = await User.find({}).exec();
  users.sort((a, b) => a.tournament - b.tournament);
  for (let i = 0; i < users.length; i += 16) {
    var tournament = [];
    for (let j = 0; j < 16; j++) {
      if (!users[i+j].quarterFinals[0]) continue;
      tournament.push(users[i + j]);
    }
    let winners = [];
    for (let k = 0; k < tournament.length; k += 2) {
      var result = await matchResult(
        tournament[k].squad,
        tournament[k + 1].squad
      );
      
      console.log(tournament[k].clubName+" - "+tournament[k+1].clubName+" = "+result[0]+" - "+result[1]);
      if (result[0]>result[1]) {
        winners.push(tournament[k])
      }
      else winners.push(tournament[k+1])
      tournament[k].quarterFinals[1]=(result[0]);
      tournament[k].quarterFinals[2]=(result[1]);
      tournament[k + 1].quarterFinals[1]=(result[1]);
      tournament[k + 1].quarterFinals[2]=(result[0]);
      try {
        await tournament[k].save();
        await tournament[k + 1].save();
      } catch (error) {
        console.error("Error saving users.", error);
      }
    }
    winners = await shuffleArray(winners);
    
    for (let j = 0; j<winners.length; j++){
      winners[j].money+=50;
      winners[j].semiFinals = []
      winners[j].semiFinals.push(Math.floor(j / 2) + 1)
      winners[j].semiFinals.push(0)
      winners[j].semiFinals.push(0)
      await winners[j].save();
    }
  }
  //console.log(await User.find({}).exec())
};

export const semiFinals = async () => {
  console.log ("------SEMI FINALS------")
  const users = await User.find({}).exec();
  users.sort((a, b) => a.tournament - b.tournament);
  for (let i = 0; i < users.length; i += 16) {
    var tournament = [];
    for (let j = 0; j < 16; j++) {
      if (!users[i+j].semiFinals[0]) continue;
      tournament.push(users[i + j]);
    }
    let winners = [];
    for (let k = 0; k < tournament.length; k += 2) {
      var result = await matchResult(
        tournament[k].squad,
        tournament[k + 1].squad
      );
      
      console.log(tournament[k].clubName+" - "+tournament[k+1].clubName+" = "+result[0]+" - "+result[1]);
      if (result[0]>result[1]) {
        winners.push(tournament[k])
      }
      else winners.push(tournament[k+1])
      tournament[k].semiFinals.push(result[0]);
      tournament[k].semiFinals.push(result[1]);
      tournament[k + 1].semiFinals.push(result[1]);
      tournament[k + 1].semiFinals.push(result[0]);
      try {
        await tournament[k].save();
        await tournament[k + 1].save();
      } catch (error) {
        console.error("Error saving users.", error);
      }
    }
    winners = await shuffleArray(winners);
    
    for (let j = 0; j<winners.length; j++){
      winners[j].money+=100;
      winners[j].finale = []
      winners[j].finale.push(Math.floor(j / 2) + 1)
      winners[j].finale.push(0)
      winners[j].finale.push(0)
      await winners[j].save();
    }
  }
};

export const final = async () => {
  const users = await User.find({}).exec();
  users.sort((a, b) => a.tournament - b.tournament);
  for (let i = 0; i < users.length; i += 16) {
    var tournament = [];
    for (let j = 0; j < 16; j++) {
      if (!users[i+j].finale[0]) continue;
      tournament.push(users[i + j]);
    }
    let winners = [];
    for (let k = 0; k < tournament.length; k += 2) {
      var result = await matchResult(
        tournament[k].squad,
        tournament[k + 1].squad
      );
      console.log ("------FINALE------")
      console.log(tournament[k].clubName+" - "+tournament[k+1].clubName+" = "+result[0]+" - "+result[1]);
      if (result[0]>result[1]) {
        winners.push(tournament[k])
      }
      else winners.push(tournament[k+1])
      tournament[k].finale.push(result[0]);
      tournament[k].finale.push(result[1]);
      tournament[k + 1].finale.push(result[1]);
      tournament[k + 1].finale.push(result[0]);
      try {
        await tournament[k].save();
        await tournament[k + 1].save();
      } catch (error) {
        console.error("Error saving users.", error);
      }
    }
  }
};

export const getDailyMoney = async () => {
  const users = await User.find ({}).exec();
  for (let user = 0; user < users.length; user+=1){
    users[user].money += 100;
  }
}

export default { matchResult, startTournament, eighthFinals, quarterFinals, semiFinals, final, getDailyMoney };
