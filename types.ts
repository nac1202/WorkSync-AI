
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  bio?: string;
}

export enum WorkStatus {
  OFF = 'OFF',
  WORKING = 'WORKING',
  BREAK = 'BREAK'
}

export interface TimeRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime?: string; // ISO string
  breaks: { start: string; end?: string }[];
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  comments: Comment[];
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  isPublic: boolean;
  description?: string;
}

export type ViewMode = 'dashboard' | 'timecard' | 'board' | 'calendar' | 'profile';

export type ThemeColor = 'indigo' | 'blue' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
