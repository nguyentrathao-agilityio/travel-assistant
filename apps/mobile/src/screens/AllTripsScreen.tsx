import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
import { BOTTOM_NAV_CLEARANCE } from '../constants';

// Components
import {
  AllTripsHeader,
  BottomNav,
  RenameThreadModal,
  TripsList,
  TripsSearchBar,
} from '../components';

// Hooks
import { useDebouncedValue } from '../hooks';

// Utils
import { useShellTheme } from '../theme';
import { threadLabel } from '../utils/thread';

// Types
import type { ThreadDeletionProps, ThreadRenameProps } from '../hooks';
import type { AllTripsListProps } from '../components/trips/TripsList';

export type { AllTripsListProps } from '../components/trips/TripsList';

interface AllTripsScreenProps {
  list: AllTripsListProps;
  deletion: ThreadDeletionProps;
  rename: ThreadRenameProps;
  isStartingTrip: boolean;
  onOpenThread: (threadId: string) => void;
  onStartNewTrip: () => void;
  onGoHome: () => void;
  onAskByVoice: () => void;
  onBack: () => void;
}

export const AllTripsScreen = ({
  list,
  deletion,
  rename,
  isStartingTrip,
  onOpenThread,
  onStartNewTrip,
  onGoHome,
  onAskByVoice,
  onBack,
}: AllTripsScreenProps) => {
  const { threads } = list;
  const { deletingThreadId, isDeletingAll, onDeleteAllTrips, onDeleteThread } = deletion;
  const { renamingThread, isRenaming, onStartRename, onCancelRename, onConfirmRename } = rename;
  const { colors } = useShellTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const listBottomClearance = insets.bottom + BOTTOM_NAV_CLEARANCE;

  const filteredThreads = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();

    if (!query) return threads;

    return threads.filter((thread) => threadLabel(thread).toLowerCase().includes(query));
  }, [threads, debouncedQuery]);

  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <AllTripsHeader
        isDeletingAll={isDeletingAll}
        onBack={onBack}
        onDeleteAll={onDeleteAllTrips}
        topInset={insets.top}
      />
      <TripsSearchBar
        onChangeQuery={setSearchQuery}
        onFocusChange={setIsSearchFocused}
        query={searchQuery}
      />
      <TripsList
        {...list}
        deletingThreadId={deletingThreadId}
        filteredThreads={filteredThreads}
        isSearching={isSearching}
        listBottomClearance={listBottomClearance}
        onDeleteThread={onDeleteThread}
        onOpenThread={onOpenThread}
        onStartRename={onStartRename}
      />

      {!isSearchFocused && (
        <BottomNav
          activeTab="chat"
          isChatDisabled={isStartingTrip}
          onAskByVoice={onAskByVoice}
          onGoHome={onGoHome}
          onStartNewChat={onStartNewTrip}
        />
      )}

      <RenameThreadModal
        initialTitle={renamingThread?.title ?? ''}
        isSaving={isRenaming}
        onCancel={onCancelRename}
        onSave={onConfirmRename}
        visible={renamingThread !== null}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({ container: { flex: 1 } });
