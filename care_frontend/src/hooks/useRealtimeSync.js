import { useEffect, useRef } from 'react';
import realtimeService from '../services/realtimeService';

/**
 * Custom React Hook for Realtime Sync in Care Network Frontend
 * @param {Object} options
 * @param {Array<string>} options.channels - Channel names to subscribe to (e.g. ['doctor:123', 'facility:456', 'patient:789'])
 * @param {Function} options.onEvent - Callback triggered when matching domain event is received
 * @param {Function} options.onReconnectRefetch - Callback triggered on reconnection to refetch latest resources
 */
export const useRealtimeSync = ({ channels = [], onEvent, onReconnectRefetch }) => {
  const onEventRef = useRef(onEvent);
  const onReconnectRefetchRef = useRef(onReconnectRefetch);

  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectRefetchRef.current = onReconnectRefetch;
  }, [onEvent, onReconnectRefetch]);

  useEffect(() => {
    if (!channels || channels.length === 0) return;

    const filteredChannels = channels.filter(Boolean);
    if (filteredChannels.length === 0) return;

    realtimeService.subscribe(filteredChannels);

    const removeEventListener = realtimeService.addListener((eventPayload) => {
      if (onEventRef.current) {
        onEventRef.current(eventPayload);
      }
    });

    const removeReconnectListener = realtimeService.addReconnectListener(() => {
      if (onReconnectRefetchRef.current) {
        console.log('🔄 Reconnected to care socket server. Triggering resource refetch sync...');
        onReconnectRefetchRef.current();
      }
    });

    return () => {
      removeEventListener();
      removeReconnectListener();
      realtimeService.unsubscribe(filteredChannels);
    };
  }, [JSON.stringify(channels)]);
};

export default useRealtimeSync;
