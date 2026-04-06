'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Modal, Button, Group, Slider, Text, Stack } from '@mantine/core';
import { IconZoomIn, IconZoomOut, IconCheck, IconX } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

interface ImageCropModalProps {
  opened: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (file: File) => void;
  cropShape?: 'round' | 'rect';
  aspect?: number;
}

async function getCroppedImage(imageSrc: string, cropArea: Area): Promise<File> {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'profile-picture.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}

export function ImageCropModal({
  opened,
  onClose,
  imageSrc,
  onCropComplete,
  cropShape = 'round',
  aspect = 1,
}: ImageCropModalProps) {
  const t = useTranslations();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropAreaChange = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const croppedFile = await getCroppedImage(imageSrc, croppedAreaPixels);
      onCropComplete(croppedFile);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('profile.edit.cropPhoto')}
      size="md"
      radius="lg"
      centered
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 350,
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaChange}
          />
        </div>

        <Group gap="sm" align="center">
          <IconZoomOut size={18} className="text-gray-500" />
          <Slider
            value={zoom}
            onChange={setZoom}
            min={1}
            max={3}
            step={0.05}
            className="flex-1"
            color="eco-blue"
            size="sm"
            label={null}
          />
          <IconZoomIn size={18} className="text-gray-500" />
        </Group>

        <Group justify="flex-end" pt="xs">
          <Button variant="default" onClick={onClose} radius="md" leftSection={<IconX size={16} />}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            color="eco-blue"
            radius="md"
            leftSection={<IconCheck size={16} />}
          >
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
