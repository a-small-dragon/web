import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The landing route for a role after login / on '/'. Admin has its own console; keeping this in
// one place stops role redirects from looping (e.g. admin bounced between /exams and /take).
export function homeFor(role: string): string {
  return role === 'admin' ? '/admin' : role === 'student' ? '/take' : '/exams'
}
