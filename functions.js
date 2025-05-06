import { User } from "./models/UserModel.js";
import { Player } from "./models/PlayerModel.js";
import countries from './countries.json' with { type: "json" }


const getCountryCode = (country) => {
  const foundCountry = countries.find(c => c.country.toLowerCase() === country.toLowerCase())
  return foundCountry ? foundCountry.abbreviation : "XX"
}

const getCountry = (countryCode) => {
  const foundCountry = countries.find(c => c.abbreviation === countryCode)
  return foundCountry ? foundCountry.country : "Unknown"
}

export const newPlayer = async () => {
  while (true) {
    const response = await fetch("https://randomuser.me/api/");
    const data = await response.json();
    const gender = data.results[0].gender;
    const nameLength =
      data.results[0].name.first.length + data.results[0].name.last.length;
    if (gender === "male" && nameLength < 12) {
      const firstName = data.results[0].name.first;
      const lastName = data.results[0].name.last;
      const country = data.results[0].location.country;
      const countryCode = getCountryCode(country);
      const regex = /^[A-Za-zČčĆćĐđŠšŽž\s]+$/;
      if (regex.test(firstName) && regex.test(lastName)) {
        return { name: `${firstName} ${lastName}`, country: country, countryCode: countryCode };
      }
    }
  }
};

export const checkNumberOfPlayersInDB = async () => {
  const numberOfPlayers = await Player.countDocuments({}).exec()
  return numberOfPlayers;
}

export const addPlayerToDB = async () => {
  const getNewPlayer = await newPlayer()
  try {
    const addPlayer = {
      playerName: getNewPlayer.name,
      country: getNewPlayer.country,
      countryCode: getNewPlayer.countryCode,
      rating: 0,
      position: ""
    }
    const player = await Player.create(addPlayer)
  } catch (error) {console.log(error)}
}

export const shuffleArray = async (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const playerPosition = async () => {
  const positions = ["GK", "DEF", "DEF", "MID", "MID", "ATT", "ATT"]
  return positions[Math.floor(Math.random()*positions.length)]
}

export const playerRating = async () => {
  const randomNumber = Math.random();
  let playerRating;
  if (randomNumber <= 0.5) {
    playerRating = Math.floor(51 + 10 * Math.random());
  } else if (randomNumber > 0.5 && randomNumber <= 0.7) {
    playerRating = Math.floor(55 + 15 * Math.random());
  } else if (randomNumber > 0.7 && randomNumber <= 0.9) {
    playerRating = Math.floor(65 + 14 * Math.random());
  } else if (randomNumber > 0.9 && randomNumber <= 0.98) {
    playerRating = Math.floor(70 + 20 * Math.random());
  } else {
    playerRating = Math.floor(70 + 27 * Math.random());
  }
  return playerRating;
};

export const createClub = async (name) => {
  try {
    const concatenatedString = name.split(" ").join("");
    const firstLetter = concatenatedString.charAt(0).toLowerCase();
    const restOfWord = concatenatedString.slice(1);
    const username = firstLetter + restOfWord;
    const names = [];
    while (names.length < 11) {
      const newPlayerData = await Player.findOne({});
      await Player.deleteOne({_id : newPlayerData._id})
      names.push(newPlayerData);
    }
    let squad = [];
    squad.push({
      playerName: names[0].playerName,
      country: names[0].country,
      countryCode: names[0].countryCode,
      rating: await playerRating(),
      position: "GK",
    });
    for (let i = 1; i <= 4; i++) {
      squad.push({
        playerName: names[i].playerName,
        country: names[i].country,
        countryCode: names[i].countryCode,
        rating: await playerRating(),
        position: "DEF",
      });
    }
    for (let i = 5; i <= 7; i++) {
      squad.push({
        playerName: names[i].playerName,
        country: names[i].country,
        countryCode: names[i].countryCode,
        rating: await playerRating(),
        position: "MID",
      });
    }
    for (let i = 8; i <= 10; i++) {
      squad.push({
        playerName: names[i].playerName,
        country: names[i].country,
        countryCode: names[i].countryCode,
        rating: await playerRating(),
        position: "ATT",
      });
    }
    const newUser = {
      username: username,
      password: "zelovarnogeslo",
      clubName: name,
      index: 0,
      squad: squad,
    };
    const user = await User.create(newUser);
  } catch (error) {
    console.log(error.message);
    return;
  }
};

export const calculateNationBonus = (squad) => {
  let nations = {};
  const calculatePartialBonus = (players, percentage) => {
    let bonus = 0;
    let obj = {}

    for (let i = 0; i < players.length; i++) {
      let code = players[i].countryCode;
      if (obj[code]) obj[code] += 1
      else {
        obj[code] = 1;
      }
    }
    let values = Object.values(obj)
    for (let i = 0; i < values.length; i++) {
      if (values[i] > 1) bonus += values[i] * percentage;
    }
    for (const [key, value] of Object.entries(obj)) {
      if (value < 2) continue;
      if (nations[getCountry(key)]) nations[getCountry(key)] += value * percentage * (1.1 - values.length / 10);
      else nations[getCountry(key)] = value * percentage * (1.1 - values.length / 10)
    }
    bonus *= (1.1 - values.length / 10)
    return bonus
  }
  let overallBonus = Math.round(calculatePartialBonus(squad, 4.54545455) +
    calculatePartialBonus(squad.slice(1, 5), 5) +
    calculatePartialBonus(squad.slice(5, 8), 5) +
    calculatePartialBonus(squad.slice(8, 11), 5));
  nations = Object.entries(nations)
  nations = nations.sort((a, b) => b[1] - a[1]);
  let counter = 0;
  for (let i= 0; i<nations.length;i++) {
    nations[i][1] = Math.round(nations[i][1])
    counter += nations[i][1]
  }
  const difference = overallBonus-counter;
  let index = 0;
  while (index <difference) {
    if (index > nations.length) index = 0;
    nations[index][1] += 1;
    index++;
  }
  if (counter>overallBonus) overallBonus=counter;
  nations = Object.fromEntries(nations)
  return [overallBonus, nations]
}


export const calculateRatingBonus = (squad) => {
  let bonus = 0;
  for (let i = 0; i < squad.length; i++) {
    bonus += squad[i].rating;
  }

  return Math.trunc(bonus / 11);
}

export const calculatePositionBonus = (squad) => {
  let bonus = 1;
  for (let i = 0; i < squad.length; i++) {
    if (i === 0 && squad[i].position != "GK") bonus *= 0.5;
    if (i === 1 || i === 2 || i === 3 || i === 4) {
      if (squad[i].position === "MID") bonus *= 0.9
      if (squad[i].position === "ATT") bonus *= 0.8
      if (squad[i].position === "GK") bonus *= 0.6
    }
    if (i === 5 || i === 6 || i === 7) {
      if (squad[i].position === "DEF") bonus *= 0.9
      if (squad[i].position === "ATT") bonus *= 0.9
      if (squad[i].position === "GK") bonus *= 0.6
    }
    if (i === 8 || i === 9 || i === 10) {
      if (squad[i].position === "DEF") bonus *= 0.8
      if (squad[i].position === "MID") bonus *= 0.9
      if (squad[i].position === "GK") bonus *= 0.6
    }
  }
  return Math.floor(bonus * 100);
}


export default { newPlayer, playerRating, playerPosition, createClub, calculateNationBonus, calculateRatingBonus, calculatePositionBonus, addPlayerToDB };
