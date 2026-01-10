import { useState, useCallback } from 'react';
import { Plus, Trash2, Send, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArenaPanel } from './components/ArenaPanel';
import { useArenaStore } from './stores/arenaStore';
import { useArenaCompare } from './hooks/useArenaCompare';

export default function Arena() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const {
    panels,
    panelStates,
    globalSystemPrompt,
    globalTemperature,
    globalMaxTokens,
    isComparing,
    messages,
    addPanel,
    setGlobalSystemPrompt,
    setGlobalTemperature,
    setGlobalMaxTokens,
    clearMessages,
  } = useArenaStore();

  const { compare, stop } = useArenaCompare();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isComparing) return;
      compare(input.trim());
      setInput('');
    },
    [input, isComparing, compare]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const canAddPanel = panels.length < 4;
  const canRemovePanel = panels.length > 2;
  const hasValidPanels = panels.some((p) => p.channelId && p.model);

  return (
    <TooltipProvider>
      <div className="bg-background flex h-screen w-full">
        {/* Settings Sidebar */}
        <div className="bg-card shadow-soft border-border m-4 flex w-[300px] min-w-[260px] flex-col rounded-2xl border">
          <div className="border-b p-4">
            <h1 className="text-xl font-bold tracking-tight">{t('arena.title')}</h1>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{t('arena.description')}</p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-semibold">{t('arena.panels')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPanel}
                    disabled={!canAddPanel}
                    className="flex-1"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {t('arena.addPanel')}
                  </Button>
                </div>
                <p className="text-muted-foreground text-[10px]">
                  {t('arena.panelCount', { count: panels.length, max: 4 })}
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="temperature" className="text-xs font-semibold">
                  {t('playground.settings.temperature')}: {globalTemperature}
                </Label>
                <div className="px-1">
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={globalTemperature}
                    onChange={(e) => setGlobalTemperature(parseFloat(e.target.value))}
                    className="bg-muted h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div className="text-muted-foreground mt-1 flex justify-between text-[10px]">
                    <span>0</span>
                    <span>1</span>
                    <span>2</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="maxTokens" className="text-xs font-semibold">
                  {t('playground.settings.maxTokens')}
                </Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max="128000"
                  value={globalMaxTokens}
                  onChange={(e) => setGlobalMaxTokens(parseInt(e.target.value))}
                  className="h-9"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="systemPrompt" className="text-xs font-semibold">
                  {t('playground.settings.systemPrompt')}
                </Label>
                <Textarea
                  id="systemPrompt"
                  placeholder={t('playground.settings.defaultSystemPrompt')}
                  value={globalSystemPrompt}
                  onChange={(e) => setGlobalSystemPrompt(e.target.value)}
                  rows={4}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="space-y-2 border-t p-4">
            <Button
              onClick={clearMessages}
              variant="outline"
              className="h-9 w-full text-xs"
              disabled={isComparing || messages.length === 0}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              {t('arena.clearAll')}
            </Button>
          </div>
        </div>

        {/* Main Arena Area */}
        <div className="flex flex-1 flex-col p-4 pl-0">
          <div className="shadow-soft border-border bg-card flex h-full flex-col rounded-2xl border">
            {/* Panels Grid */}
            <div className="flex-1 overflow-hidden p-4">
              <Group orientation="horizontal" className="h-full">
                {panels.map((panel, index) => (
                  <Panel key={panel.id} minSize={20} defaultSize={100 / panels.length}>
                    {index > 0 && <Separator className="mx-2 w-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600" />}
                    <ArenaPanel
                      panel={panel}
                      state={panelStates[panel.id]}
                      canRemove={canRemovePanel}
                    />
                  </Panel>
                ))}
              </Group>
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              {messages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {messages.slice(-3).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[200px] truncate rounded-lg px-3 py-1 text-xs ${
                        msg.role === 'user'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('arena.inputPlaceholder')}
                  disabled={isComparing}
                  className="flex-1"
                />
                {isComparing ? (
                  <Button type="button" variant="destructive" onClick={stop}>
                    <Square className="mr-2 h-4 w-4" />
                    {t('stop')}
                  </Button>
                ) : (
                  <Button type="submit" disabled={!input.trim() || !hasValidPanels}>
                    <Send className="mr-2 h-4 w-4" />
                    {t('arena.compare')}
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
