import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg', 'avif', 'gif'] as const;

type PublicImageProps = {
    directory: string;
    name: string;
    alt: string;
    className?: string;
};

export function PublicImage({ directory, name, alt, className }: PublicImageProps) {
    const baseDirectory = directory.replace(/\/$/, '');
    const [extensionIndex, setExtensionIndex] = useState(0);
    const [failed, setFailed] = useState(false);

    const src = useMemo(
        () => `${baseDirectory}/${name}.${IMAGE_EXTENSIONS[extensionIndex]}`,
        [baseDirectory, name, extensionIndex],
    );

    if (failed) {
        return (
            <div
                className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}
                aria-label={alt}
            />
        );
    }

    return (
        <img
            key={src}
            src={src}
            alt={alt}
            className={className}
            onError={() => {
                if (extensionIndex < IMAGE_EXTENSIONS.length - 1) {
                    setExtensionIndex((current) => current + 1);
                    return;
                }

                setFailed(true);
            }}
        />
    );
}
