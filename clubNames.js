export const clubNames = [
  "Blazeco",
  "Vortexia",
  "Solaria",
  "Quinter",
  "Dynarox",
  "Venator",
  "Mystara",
  "Falcore",
  "Zenitho",
  "Lunaris",
  "Corvion",
  "Tempest",
  "Aethero",
  "Astralis",
  "Bravion",
  "Terrano",
  "Phoenix",
  "Galaxor",
  "Valoria",
  "Rivenor",
  "Trinova",
  "Nexoria",
  "Seraph",
  "Aurion",
  "Stellix",
  "Valorix",
  "Arctura",
  "Pyralis",
  "Eclipse",
  "Radion",
  "Crimson",
  "Harbora",
  "Oceana",
  "Mistral",
  "Neptura",
  "Titanix",
  "Regalia",
  "Ignitor",
  "Zeltron",
  "Crestor",
  "Hexagon",
  "Xenora",
  "Lyricon",
  "Chronos",
  "Helicon",
  "Eternix",
  "Vespera",
  "Nebular",
  "Silvara",
  "Nyxeria"
]


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const footballClubs = shuffleArray(clubNames);
export default footballClubs;
