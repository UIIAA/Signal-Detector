-- Migration script to update database structure for N:N relationship between activities and goals

-- Step 1: Create the new activity_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_goals (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, goal_id)
);

-- Step 2: Copy existing goal_id relationships to the new table
-- This will only work if the goal_id column exists in the activities table
INSERT INTO activity_goals (activity_id, goal_id)
SELECT id, goal_id 
FROM activities 
WHERE goal_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM activity_goals WHERE activity_id = activities.id);

-- Step 3: Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_activity_goals_activity ON activity_goals(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_goals_goal ON activity_goals(goal_id);