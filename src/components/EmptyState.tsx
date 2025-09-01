import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  children 
}: EmptyStateProps) => {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="mb-4 text-muted-foreground/60">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mb-4">
            {actionLabel}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default EmptyState;