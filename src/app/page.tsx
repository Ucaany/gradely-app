import { redirect } from 'next/navigation'

export default function Home() {
  // Root "/" — middleware akan handle redirect ke dashboard sesuai role
  redirect('/login')
}
