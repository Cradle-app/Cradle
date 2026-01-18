'use client';

import { Panel, Group as PanelGroup, Separator } from 'react-resizable-panels';
import { BlueprintCanvas } from '@/components/canvas/blueprint-canvas';
import { NodePalette } from '@/components/palette/node-palette';
import { ConfigPanel } from '@/components/config/config-panel';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { GripVertical } from 'lucide-react';

function ResizeHandle({ className = '' }: { className?: string }) {
  return (
    <Separator
      className={`group relative flex w-1.5 items-center justify-center bg-transparent hover:bg-accent-cyan/10 active:bg-accent-cyan/20 transition-all duration-200 ${className}`}
    >
      <div className="z-10 flex h-12 w-5 items-center justify-center rounded-full border border-forge-border/50 bg-forge-surface/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-200 shadow-lg">
        <GripVertical className="h-3.5 w-3.5 text-forge-muted" />
      </div>
    </Separator>
  );
}

export default function HomePage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-forge-bg">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent-cyan/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-magenta/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-accent-lime/3 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <Header />
        
        {/* Main content with resizable panels */}
        <PanelGroup orientation="horizontal" className="flex-1">
          {/* Left sidebar - Node palette */}
          <Panel 
            defaultSize="18%" 
            minSize="180px" 
            maxSize="30%"
          >
            <NodePalette />
          </Panel>
          
          <ResizeHandle />
          
          {/* Main canvas */}
          <Panel 
            defaultSize="54%" 
            minSize="30%"
          >
            <main className="h-full relative">
              <BlueprintCanvas />
            </main>
          </Panel>
          
          <ResizeHandle />
          
          {/* Right sidebar - Configuration */}
          <Panel 
            defaultSize="28%" 
            minSize="200px" 
            maxSize="45%"
          >
            <ConfigPanel />
          </Panel>
        </PanelGroup>
      </div>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

