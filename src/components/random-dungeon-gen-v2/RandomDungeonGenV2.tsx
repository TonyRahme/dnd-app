import React, { ChangeEvent, ReactElement, useCallback, useRef, useState } from 'react';
import DungeonCanvas from './DungeonCanvas';
import { useDungeonGenerator } from './hooks/useDungeonGenerator';
import { downloadDungeonFile, serializeDungeon } from './shared/dungeon.io';

const PLAYER_WINDOW_NAME = 'dungeon-player-view';
const PLAYER_WINDOW_FEATURES = 'width=1024,height=800,resizable=yes,scrollbars=no';

const RandomDungeonGenV2 = (): ReactElement => {
  const {
    startRoom,
    dungeonMap,
    exitMap,
    colors,
    dragOffsets,
    revealedRoomIds,
    crawlMode,
    generate,
    reset,
    setDragOffset,
    toggleRoomReveal,
    setCrawlMode,
    loadDungeon,
  } = useDungeonGenerator();
  const [showConnectors, setShowConnectors] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const playerWindowRef = useRef<Window | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = useCallback(() => {
    const file = serializeDungeon({ startRoom, dungeonMap, exitMap, colors, dragOffsets });
    downloadDungeonFile(file);
  }, [startRoom, dungeonMap, exitMap, colors, dragOffsets]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        loadDungeon(data);
      } catch (err) {
        // eslint-disable-next-line no-alert
        alert(`Failed to load dungeon: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        // Reset so picking the same file again retriggers change.
        input.value = '';
      }
    },
    [loadDungeon],
  );

  const handleEnterCrawl = useCallback(() => {
    const url = `${window.location.pathname}?view=player`;
    const popup = window.open(url, PLAYER_WINDOW_NAME, PLAYER_WINDOW_FEATURES);
    if (!popup) {
      // eslint-disable-next-line no-alert
      alert('Could not open Player Screen. Please allow pop-ups for this site.');
      return;
    }
    playerWindowRef.current = popup;
    setCrawlMode(true);
  }, [setCrawlMode]);

  const handleExitCrawl = useCallback(() => {
    if (playerWindowRef.current && !playerWindowRef.current.closed) {
      playerWindowRef.current.close();
    }
    playerWindowRef.current = null;
    setCrawlMode(false);
  }, [setCrawlMode]);

  return (
    <div className="random-dungeon-gen-v2">
      <h2>Random Dungeon Generator (v2 — react-konva)</h2>

      <div className="controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button type="button" className="btn btn-primary" onClick={generate}>
          New Dungeon
        </button>
        <button type="button" className="btn btn-secondary" onClick={reset}>
          Reset Dungeon
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleSave}
          disabled={dungeonMap.size === 0}
        >
          Save
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={handleImportClick}>
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {crawlMode ? (
          <button type="button" className="btn btn-danger" onClick={handleExitCrawl}>
            Exit Dungeon Crawl
          </button>
        ) : (
          <button type="button" className="btn btn-success" onClick={handleEnterCrawl}>
            Player&apos;s Screen
          </button>
        )}

        <label className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={showConnectors}
            onChange={(e) => setShowConnectors(e.target.checked)}
          />
          <span className="form-check-label">{showConnectors ? 'Hide' : 'Show'} Room Connectors</span>
        </label>

        <label className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={showTooltip}
            onChange={(e) => setShowTooltip(e.target.checked)}
          />
          <span className="form-check-label">{showTooltip ? 'Hide' : 'Show'} Tooltip</span>
        </label>

        <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: '0.85rem' }}>
          Rooms: {dungeonMap.size} · Exits: {exitMap.size}
          {crawlMode && ` · Revealed: ${revealedRoomIds.size}`}
        </span>
      </div>

      <DungeonCanvas
        startRoom={startRoom}
        dungeonMap={dungeonMap}
        exitMap={exitMap}
        colors={colors}
        dragOffsets={dragOffsets}
        onDragOffset={setDragOffset}
        revealedRoomIds={revealedRoomIds}
        crawlMode={crawlMode}
        onToggleReveal={toggleRoomReveal}
        showConnectors={showConnectors}
        showTooltip={showTooltip}
      />
    </div>
  );
};

export default RandomDungeonGenV2;
