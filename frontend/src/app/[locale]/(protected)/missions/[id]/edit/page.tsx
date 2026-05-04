import { EditMissionClient } from './EditMissionClient';

export default async function EditMissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditMissionClient id={id} />;
}
