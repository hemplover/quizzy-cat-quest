
import { supabase } from '@/integrations/supabase/client';

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

// Add XP to a user's total and save it
export const addUserXP = async (xpToAdd: number) => {
  try {
    // Get current user ID
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    
    if (!userId) {
      console.error('Cannot add XP: User not authenticated');
      return false;
    }
    
    // Get current XP
    const currentXP = parseInt(localStorage.getItem(`userXP_${userId}`) || '0', 10);
    
    // Add new XP
    const newXP = currentXP + xpToAdd;
    
    // Save to localStorage
    localStorage.setItem(`userXP_${userId}`, newXP.toString());
    
    console.log(`Added ${xpToAdd} XP. New total: ${newXP}`);
    
    // Check if user leveled up
    const oldLevelInfo = getLevelInfo(currentXP);
    const newLevelInfo = getLevelInfo(newXP);
    
    return {
      newXP,
      leveledUp: oldLevelInfo.current.name !== newLevelInfo.current.name,
      oldLevel: oldLevelInfo.current,
      newLevel: newLevelInfo.current
    };
  } catch (error) {
    console.error('Error adding XP:', error);
    return false;
  }
};

// Get the user's current XP
export const getUserXP = async () => {
  try {
    // Get current user ID
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    
    if (!userId) {
      console.error('Cannot get XP: User not authenticated');
      return 0;
    }
    
    // Get current XP from localStorage
    return parseInt(localStorage.getItem(`userXP_${userId}`) || '0', 10);
  } catch (error) {
    console.error('Error getting XP:', error);
    return 0;
  }
};
