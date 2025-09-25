-- Migration v3: Goal Progress Tracking
-- Adds progress tracking capabilities to goals

-- Add progress tracking columns to goals table
ALTER TABLE goals ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100);
ALTER TABLE goals ADD COLUMN is_completed BOOLEAN DEFAULT 0;
ALTER TABLE goals ADD COLUMN completed_at DATETIME NULL;
ALTER TABLE goals ADD COLUMN last_activity_at DATETIME NULL;

-- Create indexes for performance
CREATE INDEX idx_activities_classification_date ON activities(classification, created_at DESC);
CREATE INDEX idx_goals_progress ON goals(user_id, progress_percentage DESC);
CREATE INDEX idx_goals_completed ON goals(user_id, is_completed);

-- Insert test data for existing goals if they don't have progress
UPDATE goals SET progress_percentage =
  CASE
    WHEN goal_type = 'short' THEN CAST((julianday('now') - julianday(created_at)) * 30 AS INTEGER)
    WHEN goal_type = 'medium' THEN CAST((julianday('now') - julianday(created_at)) * 10 AS INTEGER)
    ELSE CAST((julianday('now') - julianday(created_at)) * 5 AS INTEGER)
  END
WHERE progress_percentage = 0;

-- Ensure progress doesn't exceed 100
UPDATE goals SET progress_percentage = 100 WHERE progress_percentage > 100;