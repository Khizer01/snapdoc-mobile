import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChatRedirect() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (scanId) router.replace(`/(app)/result/${scanId}`);
  }, [scanId]);

  return null;
}
