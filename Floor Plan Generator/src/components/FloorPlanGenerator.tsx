import React, { useState, useRef } from 'react';
import { Room, PlotDimensions, VastuRule } from '../types';
import { Grid, Compass, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

const CELL_SIZE = 40; // pixels per unit

const ROOM_COLORS = {
  master_bedroom: '#90cdf4',
  bedroom: '#63b3ed',
  kitchen: '#9ae6b4',
  living_room: '#fbd38d',
  dining_room: '#fbd38d',
  pooja_room: '#feb2b2',
  bathroom: '#e9d8fd',
  staircase: '#cbd5e0',
  common_area: '#fbd38d',
};

const VASTU_RULES: Record<string, VastuRule> = {
  master_bedroom: {
    direction: 'southwest',
    defaultSize: { length: 12, width: 15 },
    description: 'Master bedroom should be in the Southwest direction for stability and peace.',
    preferences: {
      hasAttachedWashroom: true,
    },
  },
  bedroom: {
    direction: 'west',
    defaultSize: { length: 10, width: 12 },
    description: 'Additional bedrooms should be in the West direction.',
    preferences: {
      hasAttachedWashroom: false,
    },
  },
  kitchen: {
    direction: 'southeast',
    defaultSize: { length: 8, width: 10 },
    description: 'Kitchen should be in the Southeast direction for positive energy while cooking.',
    preferences: {
      isOpen: false,
    },
  },
  pooja_room: {
    direction: 'northeast',
    defaultSize: { length: 6, width: 6 },
    description: 'Pooja room should be in the Northeast direction for spiritual growth.',
  },
  bathroom: {
    direction: 'northwest',
    defaultSize: { length: 5, width: 5 },
    description: 'Bathroom should be in the Northwest direction.',
  },
  living_room: {
    direction: 'north',
    defaultSize: { length: 15, width: 12 },
    description: 'Living room should be in the North or East direction for prosperity.',
    preferences: {
      isCombined: false,
    },
  },
  dining_room: {
    direction: 'east',
    defaultSize: { length: 10, width: 12 },
    description: 'Dining room should be in the East direction for harmonious meals.',
    preferences: {
      isCombined: false,
    },
  },
  staircase: {
    direction: 'south',
    defaultSize: { length: 6, width: 10 },
    description: 'Staircase should be in the South or West direction for positive energy flow.',
    preferences: {
      isInside: true,
    },
  },
  common_area: {
    direction: 'north',
    defaultSize: { length: 20, width: 15 },
    description: 'Combined living and dining area should be in the North direction.',
  },
};

const getPositionForDirection = (
  direction: string,
  plotDimensions: PlotDimensions,
  roomSize: { length: number; width: number }
): { x: number; y: number } => {
  const { length, width } = plotDimensions;
  
  switch (direction) {
    case 'northeast':
      return { x: 0, y: 0 };
    case 'north':
      return { x: Math.floor(width / 4), y: 0 };
    case 'northwest':
      return { x: width - roomSize.width, y: 0 };
    case 'east':
      return { x: 0, y: Math.floor(length / 4) };
    case 'southeast':
      return { x: 0, y: length - roomSize.length };
    case 'south':
      return { x: Math.floor(width / 4), y: length - roomSize.length };
    case 'southwest':
      return { x: width - roomSize.width, y: length - roomSize.length };
    case 'west':
      return { x: width - roomSize.width, y: Math.floor(length / 4) };
    default:
      return { x: 0, y: 0 };
  }
};

export default function FloorPlanGenerator() {
  const [plotDimensions, setPlotDimensions] = useState<PlotDimensions>({
    length: 50,
    width: 30,
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  const [newRoom, setNewRoom] = useState({
    type: 'master_bedroom',
    length: VASTU_RULES.master_bedroom.defaultSize.length,
    width: VASTU_RULES.master_bedroom.defaultSize.width,
    preferences: {
      hasAttachedWashroom: true,
      isOpen: false,
      isInside: true,
      isCombined: false,
    },
  });

  const addRoom = () => {
    const id = (rooms.length + 1).toString();
    const vastuRule = VASTU_RULES[newRoom.type];
    const position = getPositionForDirection(
      vastuRule.direction,
      plotDimensions,
      { length: newRoom.length, width: newRoom.width }
    );

    const room: Room = {
      id,
      type: newRoom.type,
      size: { length: newRoom.length, width: newRoom.width },
      position,
      direction: vastuRule.direction,
      preferences: newRoom.preferences,
    };

    if (newRoom.type === 'living_room' && newRoom.preferences.isCombined) {
      const combinedRoom: Room = {
        id,
        type: 'common_area',
        size: VASTU_RULES.common_area.defaultSize,
        position,
        direction: 'north',
        preferences: { isCombined: true },
      };
      setRooms([...rooms, combinedRoom]);
    } else {
      // If room has attached washroom, automatically add it
      if (newRoom.preferences.hasAttachedWashroom) {
        const washroomId = `${id}-washroom`;
        const washroom: Room = {
          id: washroomId,
          type: 'bathroom',
          size: VASTU_RULES.bathroom.defaultSize,
          position: {
            x: position.x + newRoom.width,
            y: position.y,
          },
          direction: 'northwest',
        };
        setRooms([...rooms, room, washroom]);
      } else {
        setRooms([...rooms, room]);
      }
    }
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(room => !room.id.startsWith(id)));
  };

  const handleRoomTypeChange = (type: string) => {
    const vastuRule = VASTU_RULES[type];
    setNewRoom({
      type,
      length: vastuRule.defaultSize.length,
      width: vastuRule.defaultSize.width,
      preferences: {
        hasAttachedWashroom: vastuRule.preferences?.hasAttachedWashroom ?? false,
        isOpen: vastuRule.preferences?.isOpen ?? false,
        isInside: vastuRule.preferences?.isInside ?? true,
        isCombined: vastuRule.preferences?.isCombined ?? false,
      },
    });
  };

  const exportFloorPlan = async () => {
    if (floorPlanRef.current) {
      try {
        const dataUrl = await toPng(floorPlanRef.current);
        const link = document.createElement('a');
        link.download = 'floor-plan.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error exporting floor plan:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Grid className="w-12 h-12 text-indigo-600" />
            <Compass className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vastu Floor Plan Generator</h1>
          <p className="text-lg text-gray-600">Create Vastu-compliant floor plans with proper room placement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Plot Dimensions</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                <input
                  type="number"
                  value={plotDimensions.length}
                  onChange={(e) => setPlotDimensions({ ...plotDimensions, length: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                <input
                  type="number"
                  value={plotDimensions.width}
                  onChange={(e) => setPlotDimensions({ ...plotDimensions, width: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-6">Add New Room</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newRoom.type}
                  onChange={(e) => handleRoomTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {Object.entries(VASTU_RULES).filter(([type]) => type !== 'common_area').map(([type, rule]) => (
                    <option key={type} value={type}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} ({rule.direction})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {VASTU_RULES[newRoom.type].description}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                <input
                  type="number"
                  value={newRoom.length}
                  onChange={(e) => setNewRoom({ ...newRoom, length: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (m)</label>
                <input
                  type="number"
                  value={newRoom.width}
                  onChange={(e) => setNewRoom({ ...newRoom, width: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              {VASTU_RULES[newRoom.type].preferences?.hasAttachedWashroom !== undefined && (
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRoom.preferences.hasAttachedWashroom}
                      onChange={(e) => setNewRoom({
                        ...newRoom,
                        preferences: { ...newRoom.preferences, hasAttachedWashroom: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Include attached washroom</span>
                  </label>
                </div>
              )}
              {VASTU_RULES[newRoom.type].preferences?.isOpen !== undefined && (
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRoom.preferences.isOpen}
                      onChange={(e) => setNewRoom({
                        ...newRoom,
                        preferences: { ...newRoom.preferences, isOpen: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Open layout</span>
                  </label>
                </div>
              )}
              {VASTU_RULES[newRoom.type].preferences?.isInside !== undefined && (
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRoom.preferences.isInside}
                      onChange={(e) => setNewRoom({
                        ...newRoom,
                        preferences: { ...newRoom.preferences, isInside: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Inside placement</span>
                  </label>
                </div>
              )}
              {(newRoom.type === 'living_room' || newRoom.type === 'dining_room') && (
                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRoom.preferences.isCombined}
                      onChange={(e) => setNewRoom({
                        ...newRoom,
                        preferences: { ...newRoom.preferences, isCombined: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Combined living and dining area</span>
                  </label>
                </div>
              )}
            </div>
            <button
              onClick={addRoom}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add Room
            </button>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Room List</h2>
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                  >
                    <div>
                      <span className="font-medium">
                        {room.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({room.size.length}m × {room.size.width}m)
                      </span>
                      <span className="text-gray-500 ml-2">
                        [{room.direction}]
                      </span>
                      {room.preferences?.hasAttachedWashroom && (
                        <span className="text-green-600 ml-2">(Attached Washroom)</span>
                      )}
                      {room.preferences?.isOpen && (
                        <span className="text-blue-600 ml-2">(Open Layout)</span>
                      )}
                      {room.preferences?.isInside && (
                        <span className="text-purple-600 ml-2">(Inside)</span>
                      )}
                      {room.preferences?.isCombined && (
                        <span className="text-orange-600 ml-2">(Combined)</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Floor Plan Preview</h2>
              <button
                onClick={exportFloorPlan}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div
              className="border-2 border-gray-300 rounded-lg overflow-auto"
              style={{
                width: '100%',
                height: '600px',
              }}
            >
              <div
                ref={floorPlanRef}
                style={{
                  width: plotDimensions.width * CELL_SIZE,
                  height: plotDimensions.length * CELL_SIZE,
                  position: 'relative',
                  background: '#f9fafb',
                }}
              >
                {/* Direction Labels */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-500">North</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-500">South</div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">West</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">East</div>

                {rooms.map((room) => (
                  <div
                    key={room.id}
                    style={{
                      position: 'absolute',
                      left: room.position.x * CELL_SIZE,
                      top: room.position.y * CELL_SIZE,
                      width: room.size.width * CELL_SIZE,
                      height: room.size.length * CELL_SIZE,
                      backgroundColor: ROOM_COLORS[room.type as keyof typeof ROOM_COLORS],
                      border: '2px solid rgba(0,0,0,0.1)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: 'rgba(0,0,0,0.7)',
                    }}
                  >
                    <div className="text-center">
                      <div>{room.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                      <div className="text-xs opacity-75">{room.direction}</div>
                      {room.preferences?.hasAttachedWashroom && (
                        <div className="text-xs text-green-700">Attached Bath</div>
                      )}
                      {room.preferences?.isOpen && (
                        <div className="text-xs text-blue-700">Open Layout</div>
                      )}
                      {room.preferences?.isInside && (
                        <div className="text-xs text-purple-700">Inside</div>
                      )}
                      {room.preferences?.isCombined && (
                        <div className="text-xs text-orange-700">Combined</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}