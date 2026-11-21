
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';

type Props = {
  onBack: () => void;
};

const DURATIONS = [1, 3, 5];

export default function CalmZoneScreen({ onBack }: Props) {
  const [duration, setDuration] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const breathingScale = useRef(new Animated.Value(0.75)).current;

  const totalSeconds = duration * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);

  const phaseTime = elapsed % 14;

  const phase =
    phaseTime < 4
      ? 'Inhale'
      : phaseTime < 8
      ? 'Hold'
      : 'Exhale';

  const phaseInstruction =
    phase === 'Inhale'
      ? 'Breathe in slowly through your nose.'
      : phase === 'Hold'
      ? 'Gently hold your breath.'
      : 'Slowly breathe out and release tension.';

  const completed = elapsed >= totalSeconds;

  const cycles = Math.floor(elapsed / 14);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setElapsed((previous) => Math.min(previous + 1, totalSeconds));
    }, 1000);

    return () => clearInterval(timer);
  }, [running, totalSeconds]);

  useEffect(() => {
    if (completed) {
      setRunning(false);
    }
  }, [completed]);

  useEffect(() => {
    let target = 0.75;
    let time = 1000;

    if (phase === 'Inhale') {
      target = 1.15;
      time = 4000;
    } else if (phase === 'Hold') {
      target = 1.15;
      time = 4000;
    } else {
      target = 0.75;
      time = 6000;
    }

    Animated.timing(breathingScale, {
      toValue: target,
      duration: time,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [phase, breathingScale]);

  const startSession = () => {
    if (completed) {
      setElapsed(0);
    }
    setRunning(true);
  };

  const pauseSession = () => {
    setRunning(false);
  };

  const resetSession = () => {
    setRunning(false);
    setElapsed(0);
    breathingScale.setValue(0.75);
  };

  const changeDuration = (minutes: number) => {
    setDuration(minutes);
    setElapsed(0);
    setRunning(false);
    breathingScale.setValue(0.75);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>

        <Text style={styles.headerLabel}>RAGESPACE</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>SLOW DOWN · RESET · RESTORE</Text>

        <Text style={styles.title}>Find your calm.</Text>

        <Text style={styles.description}>
          Take a moment away from everything. There is no rush.
          Just breathe and be present.
        </Text>

        <View style={styles.durationCard}>
          <Text style={styles.durationTitle}>
            CHOOSE YOUR SESSION
          </Text>

          <View style={styles.durationRow}>
            {DURATIONS.map((minutes) => (
              <Pressable
                key={minutes}
                onPress={() => changeDuration(minutes)}
                disabled={running}
                style={[
                  styles.durationButton,
                  duration === minutes && styles.durationSelected,
                ]}
              >
                <Text
                  style={[
                    styles.durationNumber,
                    duration === minutes && styles.durationTextSelected,
                  ]}
                >
                  {minutes}
                </Text>

                <Text
                  style={[
                    styles.durationUnit,
                    duration === minutes && styles.durationTextSelected,
                  ]}
                >
                  MIN
                </Text>
              </Pressable>
            ))}
          </View>

          {running && (
            <Text style={styles.durationHint}>
              Pause your session to change its duration.
            </Text>
          )}
        </View>

        <View style={styles.breathingCard}>
          <Text style={styles.breathingLabel}>
            {completed ? 'SESSION COMPLETE' : 'FOLLOW YOUR BREATH'}
          </Text>

          <Animated.View
            style={[
              styles.outerCircle,
              {
                transform: [{ scale: breathingScale }],
              },
            ]}
          >
            <View style={styles.middleCircle}>
              <View style={styles.innerCircle}>
                <Text style={styles.breathingEmoji}>
                  {completed ? '🌸' : '🌿'}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Text style={styles.phaseText}>
            {completed ? 'Beautiful work.' : running ? phase : 'Ready?'}
          </Text>

          <Text style={styles.instruction}>
            {completed
              ? 'You made time for yourself. Notice how you feel.'
              : running
              ? phaseInstruction
              : 'Press start when you are ready.'}
          </Text>

          <Text style={styles.timer}>
            {formatTime(remaining)}
          </Text>

          <Text style={styles.timerLabel}>
            {completed ? 'TIME COMPLETED' : 'TIME REMAINING'}
          </Text>
        </View>

        <View style={styles.cycleCard}>
          <View style={styles.cycleItem}>
            <Text style={styles.cycleNumber}>{cycles}</Text>
            <Text style={styles.cycleLabel}>BREATHING CYCLES</Text>
          </View>

          <View style={styles.cycleDivider} />

          <View style={styles.cycleItem}>
            <Text style={styles.cycleNumber}>{duration}</Text>
            <Text style={styles.cycleLabel}>MINUTES CHOSEN</Text>
          </View>
        </View>

        <View style={styles.controls}>
          {!running ? (
            <Pressable
              style={styles.startButton}
              onPress={startSession}
            >
              <Text style={styles.startButtonText}>
                {completed ? 'START AGAIN →' : elapsed > 0 ? 'RESUME →' : 'START SESSION →'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.startButton}
              onPress={pauseSession}
            >
              <Text style={styles.startButtonText}>PAUSE SESSION</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.resetButton}
            onPress={resetSession}
          >
            <Text style={styles.resetButtonText}>↻ RESET</Text>
          </Pressable>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>A gentle reminder</Text>
            <Text style={styles.tipText}>
              You don't have to figure everything out right now.
              Give yourself permission to pause.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          YOUR PEACE MATTERS. TAKE YOUR TIME.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF1E8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    color: '#657B61',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  headerLabel: {
    color: '#87947F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
  },
  eyebrow: {
    color: '#82947A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: '#293B2D',
    fontSize: 34,
    fontWeight: '900',
  },
  description: {
    color: '#718071',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 20,
  },
  durationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    marginBottom: 18,
  },
  durationTitle: {
    fontSize: 10,
    color: '#84927E',
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 13,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationButton: {
    flex: 1,
    backgroundColor: '#F1F3ED',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 11,
  },
  durationSelected: {
    backgroundColor: '#738B6A',
  },
  durationNumber: {
    color: '#40513D',
    fontSize: 21,
    fontWeight: '900',
  },
  durationUnit: {
    color: '#84927E',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
  durationTextSelected: {
    color: '#FFFFFF',
  },
  durationHint: {
    fontSize: 10,
    color: '#84927E',
    marginTop: 10,
  },
  breathingCard: {
    backgroundColor: '#DCE7D5',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  breathingLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '900',
    color: '#70836B',
  },
  outerCircle: {
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: '#C4D7BB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  middleCircle: {
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: '#AFC8A4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#8EAD83',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingEmoji: {
    fontSize: 37,
  },
  phaseText: {
    fontSize: 26,
    color: '#344A36',
    fontWeight: '900',
    marginTop: 17,
  },
  instruction: {
    fontSize: 12,
    color: '#647962',
    marginTop: 7,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  timer: {
    fontSize: 30,
    fontWeight: '900',
    color: '#344A36',
    marginTop: 15,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 9,
    color: '#71836C',
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 3,
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cycleItem: {
    flex: 1,
    alignItems: 'center',
  },
  cycleNumber: {
    color: '#40543D',
    fontSize: 23,
    fontWeight: '900',
  },
  cycleLabel: {
    color: '#899587',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },
  cycleDivider: {
    height: 35,
    width: 1,
    backgroundColor: '#E5EADF',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#738B6A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resetButton: {
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: '#91A18A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#60745B',
    fontWeight: '900',
    fontSize: 10,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#40513D',
  },
  tipText: {
    fontSize: 11,
    lineHeight: 18,
    color: '#788575',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    color: '#899587',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 17,
  },
});
