import { Loader } from '@mantine/core';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader color="eco-primary" size="lg" />
    </div>
  );
}
