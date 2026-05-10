import { ReactElement, useCallback } from 'react';
import { Menu, Item, ItemParams, BooleanPredicate } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';

export const ROOM_MENU_ID = 'dungeon-room-menu';

export interface RoomMenuItemProps {
  roomId: string;
}

interface RoomMenuProps {
  crawlMode: boolean;
  revealedRoomIds: Set<string>;
  onToggleReveal: (roomId: string) => void;
}

const RoomMenu = ({ crawlMode, revealedRoomIds, onToggleReveal }: RoomMenuProps): ReactElement => {
  const handleClick = useCallback(
    ({ props }: ItemParams<RoomMenuItemProps>) => {
      if (!props) return;
      onToggleReveal(props.roomId);
    },
    [onToggleReveal],
  );

  return (
    <Menu id={ROOM_MENU_ID}>
      <Item
        onClick={handleClick}
        hidden={
          (({ props }) =>
            !crawlMode || !props || revealedRoomIds.has((props as RoomMenuItemProps).roomId)) as BooleanPredicate
        }
      >
        Reveal room
      </Item>
      <Item
        onClick={handleClick}
        hidden={
          (({ props }) =>
            !crawlMode || !props || !revealedRoomIds.has((props as RoomMenuItemProps).roomId)) as BooleanPredicate
        }
      >
        Hide room
      </Item>
    </Menu>
  );
};

export default RoomMenu;
