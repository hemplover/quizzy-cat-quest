
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Define level thresholds
export const levels = [
  { name: "Scholarly Kitten", minXP: 0, maxXP: 100 },
  { name: "Curious Cat", minXP: 100, maxXP: 300 },
  { name: "Brilliant Feline", minXP: 300, maxXP: 600 },
  { name: "Wise Whiskers", minXP: 600, maxXP: 1000 },
  { name: "Academic Tabby", minXP: 1000, maxXP: 1500 },
  { name: "Professor Paws", minXP: 1500, maxXP: 2100 },
  { name: "Doctor Meow", minXP: 2100, maxXP: 2800 },
  { name: "Sage Furball", minXP: 2800, maxXP: 3600 },
  { name: "Erudite Elite", minXP: 3600, maxXP: 4500 },
  { name: "Genius Purr", minXP: 4500, maxXP: 5500 },
  { name: "Mastermind Mouser", minXP: 5500, maxXP: 10000 }
];

// Get user's XP from localStorage
export const getUserXP = async (): Promise<number> => {
  try {
    // Try to get user from Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No user ID found for XP retrieval');
      return 0;
    }
    
    const xpKey = `userXP_${userId}`;
    const storedXP = localStorage.getItem(xpKey);
    
    if (storedXP) {
      const xp = parseInt(storedXP, 10);
      console.log(`Retrieved user XP: ${xp}`);
      return isNaN(xp) ? 0 : xp;
    }
    
    console.log('No stored XP found, returning 0');
    return 0;
  } catch (error) {
    console.error('Error retrieving user XP:', error);
    return 0;
  }
};

// Update user's XP and check for level-up
export const updateUserXP = async (additionalXP: number): Promise<{ 
  newTotal: number; 
  leveledUp: boolean;
  oldLevel?: string;
  newLevel?: string;
}> => {
  try {
    // Try to get user from Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('No user ID found for XP update');
      return { newTotal: 0, leveledUp: false };
    }
    
    // Get current XP
    const currentXP = await getUserXP();
    const oldLevelInfo = getLevelInfo(currentXP);
    
    // Calculate new XP
    const newXP = currentXP + additionalXP;
    
    // Store new XP
    const xpKey = `userXP_${userId}`;
    localStorage.setItem(xpKey, newXP.toString());
    console.log(`Updated user XP: ${currentXP} + ${additionalXP} = ${newXP}`);
    
    // Check for level-up
    const newLevelInfo = getLevelInfo(newXP);
    const leveledUp = oldLevelInfo.current.name !== newLevelInfo.current.name;
    
    return { 
      newTotal: newXP, 
      leveledUp,
      oldLevel: leveledUp ? oldLevelInfo.current.name : undefined,
      newLevel: leveledUp ? newLevelInfo.current.name : undefined
    };
  } catch (error) {
    console.error('Error updating user XP:', error);
    return { newTotal: 0, leveledUp: false };
  }
};

// Get level information based on XP
export const getLevelInfo = (xp: number) => {
  let currentLevel = levels[0];
  let nextLevel = levels[0];
  
  // Find current level
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXP) {
      currentLevel = levels[i];
      nextLevel = levels[Math.min(i + 1, levels.length - 1)];
      break;
    }
  }
  
  return {
    current: currentLevel,
    next: nextLevel
  };
};

// Helper to calculate XP earned for a quiz
export const calculateQuizXP = (score: number, quizType: 'new' | 'review' = 'new'): number => {
  // Base XP is between 10-50 based on score (0-100%)
  const baseXP = Math.round(10 + (score * 40));
  
  // Multiplier based on quiz type
  const multiplier = quizType === 'review' ? 0.5 : 1;
  
  // Final XP calculation
  const earnedXP = Math.round(baseXP * multiplier);
  console.log(`Calculated XP: ${earnedXP} (score: ${score}, type: ${quizType}, base: ${baseXP})`);
  
  return earnedXP;
};

// Import supabase for user ID
import { supabase } from '@/integrations/supabase/client';
