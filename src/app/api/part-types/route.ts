import { NextResponse } from 'next/server';

// List of all available part types
export const partTypes = [
  { value: 'screen', label: 'Screen/Display', icon: '📱' },
  { value: 'battery', label: 'Battery', icon: '🔋' },
  { value: 'charging-port', label: 'Charging Port', icon: '🔌' },
  { value: 'camera', label: 'Camera', icon: '📷' },
  { value: 'motherboard', label: 'Motherboard', icon: '🖥️' },
  { value: 'back-panel', label: 'Back Panel', icon: '📦' },
  { value: 'speaker', label: 'Speaker', icon: '🔊' },
  { value: 'microphone', label: 'Microphone', icon: '🎤' },
  { value: 'sim-tray', label: 'SIM Tray', icon: '📇' },
  { value: 'buttons', label: 'Buttons', icon: '🔘' },
  { value: 'flex-cable', label: 'Flex Cable', icon: '🔗' },
  { value: 'antenna', label: 'Antenna', icon: '📡' },
  { value: 'vibration-motor', label: 'Vibration Motor', icon: '📳' },
  { value: 'earpiece', label: 'Earpiece', icon: '👂' },
  { value: 'proximity-sensor', label: 'Proximity Sensor', icon: '🔍' },
  { value: 'tools', label: 'Tools & Equipment', icon: '🔧' },
  { value: 'other', label: 'Other Parts', icon: '⚙️' },
];

// Get all part types
export async function GET() {
  return NextResponse.json({ partTypes }, { status: 200 });
}
