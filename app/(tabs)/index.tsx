import DesktopHome from '@/components/home/DesktopHome';
import MobileHome from '@/components/home/MobileHome';
import React from 'react';
import { useWindowDimensions } from 'react-native';

export default function WeeklyScheduleScreen() {
  const { width } = useWindowDimensions();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const isDesktop = width > 768; // Breakpoint for desktop/tablet

  if (isDesktop) {
    return <DesktopHome />;
  }

  return <MobileHome />;
}
