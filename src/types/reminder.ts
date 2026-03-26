export type ReminderType = 'feed' | 'medicine' | 'water' | 'moon' | 'weather' | 'risk';
export type ReminderStatus = 'pending' | 'completed' | 'missed';

export interface Reminder {
  id: string;
  pondId: string;
  pondName: string;
  type: ReminderType;
  title: string;
  description: string;
  time: string; // ISO string or just HH:mm for daily ones
  status: ReminderStatus;
  priority: 'high' | 'medium' | 'low';
}
