import { Button } from '@mantine/core';
import type { ComponentProps } from 'react';

export function AppleButton(props: ComponentProps<typeof Button>) {
  return <Button leftSection={<img src="/images/128px-Apple_logo_black.svg.png" alt="Apple" style={{ width: 18, height: 18 }} className="object-contain" />} variant="default" {...props} />;
}
