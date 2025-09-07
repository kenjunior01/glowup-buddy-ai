import React from 'react';
import { Card, CardContent } from './ui/card';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyStateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-8 text-center">
        <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}