import { ScrollView, StyleSheet, View } from 'react-native';

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Card,
  DataUnavailable,
  ErrorState,
  Header,
  LoadingState,
  Text,
  colors,
  spacing,
} from '@repo/ui';
import { ClimateCard } from '~/features/home/components/ClimateCard';
import { MetricTile } from '~/features/home/components/MetricTile';
import { QuickActions } from '~/features/home/components/QuickActions';
import { SampleBanner } from '~/features/home/components/SampleBanner';
import { formatMetric } from '~/features/home/format';
import type { HomeClimate } from '~/features/home/types';
import { useHomeClimate } from '~/features/home/useHomeClimate';
import type { MainTabParamList } from '~/navigation/types';

export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { state, retry } = useHomeClimate();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header
          title="ClimateLens"
          subtitle={
            state.status === 'ready'
              ? `${state.data.location.name}, ${state.data.location.country}`
              : 'Default location'
          }
        />

        {state.status === 'loading' ? <LoadingState /> : null}

        {state.status === 'error' ? (
          <ErrorState message={state.message} onRetry={retry} />
        ) : null}

        {state.status === 'ready' ? (
          <HomeContent
            data={state.data}
            onAskAi={() => navigation.navigate('AskAi')}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type HomeContentProps = {
  data: HomeClimate;
  onAskAi: () => void;
};

function HomeContent({ data, onAskAi }: HomeContentProps) {
  return (
    <View style={styles.section}>
      {data.isSample ? <SampleBanner /> : null}

      {data.annualMeanTempC === null ? (
        <DataUnavailable />
      ) : (
        <ClimateCard data={data} />
      )}

      <View style={styles.tiles}>
        <MetricTile
          label="Humidity"
          value={formatMetric(data.humidityPct, 0, '%')}
          color={colors.humidity}
        />
        <MetricTile
          label="Annual rain"
          value={formatMetric(data.annualRainMm, 0, 'mm')}
          color={colors.precipitation}
        />
        <MetricTile
          label="Solar"
          value={formatMetric(data.solarKwhM2Day, 1, 'kWh/m²/d')}
          color={colors.solar}
        />
      </View>

      <Card style={styles.insight}>
        <Text variant="heading">Climate Insight</Text>
        <Text variant="body" muted>
          {data.insight ?? 'Unavailable'}
        </Text>
      </Card>

      <QuickActions onAskAi={onAskAi} />

      <Text variant="caption" muted>
        {`Source: ${data.source.name} (${data.source.dataType}) · ~${data.source.resolutionKm} km grid · Baseline ${data.baseline} · Current year ${data.currentYear}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.lg,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  insight: {
    gap: spacing.sm,
  },
});
