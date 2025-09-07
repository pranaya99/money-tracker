import { redirect } from 'next/navigation';

export default function Root() {
  // Default entry goes to your favorite landing screen
  redirect('/welcome');
}
