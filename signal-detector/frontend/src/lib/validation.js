import { z } from 'zod';

// User validation schemas
export const UserSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const UserRegistrationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
});

// Activity validation schemas
export const ActivitySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  goalId: z.string().optional(),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration too long (max 24 hours)'),
  impact: z.number().min(1).max(10).optional(),
  effort: z.number().min(1).max(10).optional(),
  energy_before: z.number().min(1).max(10).optional(),
  energy_after: z.number().min(1).max(10).optional(),
  signal_score: z.number().min(0).max(100).optional(),
  classification: z.enum(['SINAL', 'RUÍDO', 'NEUTRO']).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  reasoning: z.string().max(1000).optional(),
  classification_method: z.enum(['rules', 'ai', 'manual']).optional(),
  voice_file_path: z.string().max(500).optional(),
  transcription: z.string().max(5000).optional(),
});

export const ActivityUpdateSchema = ActivitySchema.partial().extend({
  id: z.string().min(1, 'Activity ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// Goal validation schemas
export const GoalSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000).optional(),
  target_value: z.number().optional(),
  current_value: z.number().optional(),
  goal_type: z.enum(['short', 'medium', 'long']).optional(),
  ai_suggested: z.boolean().optional(),
  framework_type: z.enum(['none', 'okr', 'smart', 'habits', 'gtd', 'custom']).optional(),
  framework_data: z.any().optional(), // JSON data
});

export const GoalUpdateSchema = GoalSchema.partial().extend({
  id: z.string().min(1, 'Goal ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// Habit validation schemas
export const HabitSchema = z.object({
  goalId: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000).optional(),
  habit_type: z.enum(['build', 'break', 'maintain']),
  frequency_type: z.enum(['daily', 'weekly', 'custom']),
  target_days_per_week: z.number().int().min(1).max(7),
  target_streak: z.number().int().optional(),
  preferred_time_of_day: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
  estimated_duration: z.number().int().optional(),
  cue: z.string().max(500).optional(),
  reward: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  paused_until: z.string().optional(),
});

export const HabitCheckinSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  checkin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  completed: z.boolean(),
  notes: z.string().max(500).optional(),
  energy_level: z.number().min(1).max(5).optional(),
  difficulty: z.number().min(1).max(5).optional(),
});

// Time block validation schemas
export const TimeBlockSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  block_type: z.enum(['Focus', 'Deep Work', 'Meeting', 'Break', 'Learning', 'Admin', 'Personal', 'Other']),
  start_time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid start time format'),
  end_time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid end time format'),
  goal_id: z.string().optional(),
  impact: z.number().min(1).max(10).optional(),
  effort: z.number().min(1).max(10).optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'missed']).optional(),
  is_recurring: z.boolean().optional(),
  recurrence_rule: z.string().max(100).optional(),
});

// Common schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export const FilterSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  timeframe: z.enum(['day', 'week', 'month', 'all']).optional().default('week'),
});

// Export schema validation functions
export const validateWithSchema = (schema, data) => {
  try {
    return {
      success: true,
      data: schema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      errors: error.errors?.map(err => ({
        field: err.path.join('.'),
        message: err.message
      })) || [{ field: 'unknown', message: 'Validation error' }]
    };
  }
};