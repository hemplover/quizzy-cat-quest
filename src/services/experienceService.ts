
// XP levels data
export const xpLevels = [
  { name: 'Scholarly Kitten', minXP: 0, maxXP: 100 },
  { name: 'Curious Cat', minXP: 100, maxXP: 500 },
  { name: 'Clever Feline', minXP: 500, maxXP: 1000 },
  { name: 'Academic Tabby', minXP: 1000, maxXP: 2500 },
  { name: 'Wisdom Tiger', minXP: 2500, maxXP: 5000 }
];

// Get level based on XP
export const getLevelInfo = (xp: number) => {
  let currentLevel = xpLevels[0];
  let nextLevel = xpLevels[1];
  
  for (let i = 0; i < xpLevels.length; i++) {
    if (xp >= xpLevels[i].minXP) {
      currentLevel = xpLevels[i];
      nextLevel = xpLevels[i + 1] || xpLevels[i];
    } else {
      break;
    }
  }
  
  return {
    current: currentLevel,
    next: nextLevel
  };
};
