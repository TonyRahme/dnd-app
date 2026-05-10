import React, { ReactElement, useMemo } from 'react';
import { Vector2 } from './shared/model/Transform';

interface EntityTooltipProps {
  position: Vector2 | null;
  description: string;
  isHidden: boolean;
}

const TOOLTIP_PROP_REGEX = /(\w+:\s*[^,()]+(?:\([^)]*\))?)/g;

const EntityTooltip = ({ position, description, isHidden }: EntityTooltipProps): ReactElement | null => {
  const properties = useMemo(() => {
    if (!description) return [];
    return description.match(TOOLTIP_PROP_REGEX) ?? [];
  }, [description]);

  if (isHidden || !position || properties.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        transform: 'translate(-50%, calc(-100% - 8px))',
        padding: '10px',
        borderRadius: '3px',
        boxShadow: '0 0 5px grey',
        zIndex: 10,
        backgroundColor: 'white',
        pointerEvents: 'none',
        fontSize: '12px',
        whiteSpace: 'nowrap',
      }}
    >
      <ol style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
        {properties.map((prop, idx) => (
          <li key={idx}>{prop}</li>
        ))}
      </ol>
    </div>
  );
};

export default EntityTooltip;
