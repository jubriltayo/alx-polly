import { format, parseISO, isBefore, isAfter } from 'date-fns';

export function formatDate(date: string | Date, dateFormat = 'PPP') {
  return format(typeof date === 'string' ? parseISO(date) : date, dateFormat);
}

export function isExpired(date: string | Date) {
  return isBefore(typeof date === 'string' ? parseISO(date) : date, new Date());
}

export function isFuture(date: string | Date) {
  return isAfter(typeof date === 'string' ? parseISO(date) : date, new Date());
}
