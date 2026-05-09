import React, { ReactElement, useState } from 'react';
import DungeonCanvas from './DungeonCanvas';
import { useDungeonGenerator } from './hooks/useDungeonGenerator';

const RandomDungeonGenV2 = (): ReactElement => {
  const { startRoom, dungeonMap, exitMap, colors, dragOffsets, generate, reset, setDragOffset } =
    useDungeonGenerator();
  const [showConnectors, setShowConnectors] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

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
        </span>
      </div>

      <DungeonCanvas
        startRoom={startRoom}
        dungeonMap={dungeonMap}
        exitMap={exitMap}
        colors={colors}
        dragOffsets={dragOffsets}
        onDragOffset={setDragOffset}
        showConnectors={showConnectors}
        showTooltip={showTooltip}
      />
    </div>
  );
};

export default RandomDungeonGenV2;
