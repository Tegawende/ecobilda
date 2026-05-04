import { MissionDetailClient } from './MissionDetailClient';

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MissionDetailClient id={id} />;
}
