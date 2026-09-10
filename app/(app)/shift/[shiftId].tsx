import { useLocalSearchParams } from 'expo-router';
import { ShiftDetailScreen } from '../../../src/screens/restaurant/ShiftDetailScreen';

export default function ShiftDetailRoute() {
  const { shiftId } = useLocalSearchParams<{ shiftId: string }>();
  return <ShiftDetailScreen shiftId={shiftId} />;
}
