'use client';
import { redirect } from 'next/navigation';
export default function RemovedPage() {
  redirect('/user');
  return null;
}
