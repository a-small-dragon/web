import { ContentSkeleton } from '@/components/app/skeletons'

// Rendered instantly while an admin tab's server component resolves. It sits INSIDE the admin
// layout, so the header + tab bar stay put and only the content area shows the skeleton.
export default function Loading() {
  return <ContentSkeleton />
}
