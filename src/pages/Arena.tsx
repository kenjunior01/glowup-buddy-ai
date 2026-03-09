import React, { useState, useEffect } from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';
import IronLeagues from '@/components/IronLeagues';
import BloodDuels from '@/components/BloodDuels';
import BloodPactClans from '@/components/BloodPactClans';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Shield, Swords, Skull } from 'lucide-react';

const TABS = [
  { id: 'leagues', label: 'Ligas', icon: Shield, emoji: '🏆' },
  { id: 'duels', label: 'Duelos', icon: Swords, emoji: '⚔️' },
  { id: 'clans', label: 'Clãs', icon: Skull, emoji: '🩸' },
];

export default function Arena() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('leagues');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-foreground mb-3">⚔️ Arena</h1>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("px-4 py-6", !isMobile && "max-w-lg mx-auto")}>
        {activeTab === 'leagues' && <IronLeagues />}
        {activeTab === 'duels' && <BloodDuels />}
        {activeTab === 'clans' && <BloodPactClans />}
      </div>

      <MobileBottomNav />
    </div>
  );
}
