import { ProjectDetailClient } from './ProjectDetailClient';

// Legacy /projects/[id] route. Redirects to /missions for old links.
export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
