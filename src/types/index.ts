export type UserRole = 'student' | 'teacher' | 'headteacher' | 'officer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId?: string;
  countyId?: string;
  grade?: string;
  createdAt: string;
}

export interface SchemeOfWork {
  id: string;
  teacherId: string;
  learningArea: string;
  grade: string;
  term: string;
  content: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  learningArea: string;
  grade: string;
  strand: string;
  subStrand: string;
  learningOutcomes: string[];
  keyInquiryQuestions: string[];
  content: string;
  createdAt: number;
}
