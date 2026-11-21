
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ImageBackground,
  Animated,
} from 'react-native';

type Item = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  x: number;
  y: number;
};

type Blast = {
  id: string;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
};

const categories = [
  { name: 'All', emoji: '✦' },
  { name: 'Electronics', emoji: '📺' },
  { name: 'Furniture', emoji: '🪑' },
  { name: 'Bottles', emoji: '🍾' },
  { name: 'Plates', emoji: '🍽️' },
  { name: 'Boxes', emoji: '📦' },
];

const catalogue = [
  { name: 'Television', emoji: '📺', category: 'Electronics' },
  { name: 'Old phone', emoji: '📱', category: 'Electronics' },
  { name: 'Computer', emoji: '💻', category: 'Electronics' },
  { name: 'Chair', emoji: '🪑', category: 'Furniture' },
  { name: 'Sofa', emoji: '🛋️', category: 'Furniture' },
  { name: 'Table', emoji: '🪵', category: 'Furniture' },
  { name: 'Bottle', emoji: '🍾', category: 'Bottles' },
  { name: 'Glass jar', emoji: '🫙', category: 'Bottles' },
  { name: 'Drinking glass', emoji: '🥛', category: 'Bottles' },
  { name: 'Dinner plates', emoji: '🍽️', category: 'Plates' },
  { name: 'Cup', emoji: '☕', category: 'Plates' },
  { name: 'Cardboard box', emoji: '📦', category: 'Boxes' },
];

const makeItem = (
  item: (typeof catalogue)[number],
  id: string
): Item => ({
  id,
  name: item.name,
  emoji: item.emoji,
  category: item.category,
  x: Math.floor(Math.random() * 70) + 8,
  y: Math.floor(Math.random() * 32) + 48,
});

const makeInitialItems = () =>
  catalogue.slice(0, 6).map((item, index) =>
    makeItem(item, `initial-${index}`)
  );

export default function RageSpaceScreen({
  onBack,
  onFinish,
}: {
  onBack: () => void;
  onFinish: (count: number) => void;
}) {
  const [objects, setObjects] = useState<Item[]>(makeInitialItems);
  const [smashed, setSmashed] = useState(0);
  const [category, setCategory] = useState('All');
  const [blasts, setBlasts] = useState<Blast[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [finished, setFinished] = useState(false);

  const idCounter = useRef(1);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    if (finished) return;

    const timer = setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [finished]);

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const remaining = value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const addObject = (selectedCategory: string) => {
    if (objects.length >= 10) return;

    const available = catalogue.filter(
      (item) =>
        selectedCategory === 'All' ||
        item.category === selectedCategory
    );

    if (available.length === 0) return;

    const chosen =
      available[Math.floor(Math.random() * available.length)];

    const newItem = makeItem(
      chosen,
      `item-${idCounter.current++}`
    );

    setObjects((previous) =>
      previous.length >= 10 ? previous : [...previous, newItem]
    );
  };

  const smashObject = (item: Item) => {
    if (finishedRef.current) return;

    const blastId = `blast-${idCounter.current++}`;
    const scale = new Animated.Value(0.2);
    const opacity = new Animated.Value(1);

    const blast: Blast = {
      id: blastId,
      x: item.x,
      y: item.y,
      scale,
      opacity,
    };

    setBlasts((previous) => [...previous, blast]);

    setObjects((previous) =>
      previous.filter((object) => object.id !== item.id)
    );

    setSmashed((previous) => previous + 1);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.4,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setBlasts((previous) =>
        previous.filter((blastItem) => blastItem.id !== blastId)
      );
    }, 750);

    setTimeout(() => {
      if (!finishedRef.current) {
        addObject('All');
      }
    }, 900);
  };

  const resetRoom = () => {
    setObjects(makeInitialItems());
    setSmashed(0);
    setBlasts([]);
    setCategory('All');
    setSeconds(0);
    setFinished(false);
    finishedRef.current = false;
    idCounter.current += 1;
  };

  const finishSession = () => {
    setFinished(true);
    finishedRef.current = true;
    onFinish(smashed);
  };

  const visibleObjects =
    category === 'All'
      ? objects
      : objects.filter((item) => item.category === category);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require('./assets/rage-warehouse.png')}
          style={styles.room}
          resizeMode="cover"
        >
          <View style={styles.overlay} />

          <View style={styles.topBar}>
            <Pressable onPress={onBack}>
              <Text style={styles.backText}>← BACK</Text>
            </Pressable>
            <Text style={styles.brand}>RAGESPACE.</Text>
            <Text style={styles.counter}>💥 {smashed} SMASHED</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>
              <Text style={styles.orange}>RAGE</Text> ROOM
            </Text>
            <Text style={styles.subtitle}>LET IT OUT.</Text>
            <Text style={styles.instructions}>
              Tap an object in your room to smash it.
            </Text>
          </View>

          {!finished &&
            visibleObjects.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => smashObject(item)}
                style={({ pressed }) => [
                  styles.object,
                  {
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  },
                ]}
              >
                <Text style={styles.objectEmoji}>{item.emoji}</Text>
                <Text style={styles.objectName}>{item.name}</Text>
              </Pressable>
            ))}

          {blasts.map((blast) => (
            <Animated.View
              key={blast.id}
              pointerEvents="none"
              style={[
                styles.blast,
                {
                  left: `${blast.x}%`,
                  top: `${blast.y}%`,
                  opacity: blast.opacity,
                  transform: [{ scale: blast.scale }],
                },
              ]}
            >
              <Text style={styles.blastEmoji}>💥</Text>
              <Text style={styles.blastLabel}>SMASH!</Text>
            </Animated.View>
          ))}

          <View style={styles.roomFooter}>
            <Text style={styles.roomFooterText}>
              YOUR ROOM. YOUR RULES.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>💥</Text>
            <Text style={styles.statValue}>{smashed}</Text>
            <Text style={styles.statLabel}>SMASHED</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.stat}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>
              {Math.min(smashed * 5, 100)}%
            </Text>
            <Text style={styles.statLabel}>GAME PROGRESS</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.stat}>
            <Text style={styles.statIcon}>◷</Text>
            <Text style={styles.statValue}>
              {formatTime(seconds)}
            </Text>
            <Text style={styles.statLabel}>TIME</Text>
          </View>
        </View>

        {!finished ? (
          <>
            <Text style={styles.sectionTitle}>CHOOSE YOUR OBJECTS</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {categories.map((item) => (
                <Pressable
                  key={item.name}
                  onPress={() => setCategory(item.name)}
                  style={[
                    styles.categoryButton,
                    category === item.name && styles.categoryActive,
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.addButton}
              onPress={() => addObject(category)}
              disabled={objects.length >= 10}
            >
              <Text style={styles.addButtonText}>
                + ADD RANDOM OBJECT
              </Text>
            </Pressable>

            <View style={styles.actions}>
              <Pressable style={styles.resetButton} onPress={resetRoom}>
                <Text style={styles.resetText}>↻ RESET ROOM</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.finishButton,
                  smashed === 0 && styles.disabled,
                ]}
                disabled={smashed === 0}
                onPress={finishSession}
              >
                <Text style={styles.finishText}>
                  FINISH SESSION →
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.summary}>
            <Text style={styles.summaryEmoji}>✨</Text>
            <Text style={styles.summaryTitle}>Session complete!</Text>
            <Text style={styles.summaryDescription}>
              Take a moment to notice how you're feeling now.
            </Text>
            <Text style={styles.summaryNumber}>{smashed}</Text>
            <Text style={styles.summaryLabel}>OBJECTS SMASHED</Text>

            <Pressable style={styles.finishButton} onPress={resetRoom}>
              <Text style={styles.finishText}>PLAY AGAIN →</Text>
            </Pressable>

            <Pressable style={styles.resetButton} onPress={onBack}>
              <Text style={styles.resetText}>RETURN HOME</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.footer}>
          TAKE A BREAK WHENEVER YOU NEED ONE.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171614',
  },
  content: {
    paddingBottom: 25,
  },
  room: {
    height: 570,
    overflow: 'hidden',
    backgroundColor: '#29231F',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10, 8, 7, 0.25)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 12,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  counter: {
    color: '#FF9A7E',
    fontSize: 11,
    fontWeight: '900',
  },
  heading: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowRadius: 8,
  },
  orange: {
    color: '#F05A32',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 8,
  },
  instructions: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 5,
  },
  object: {
    position: 'absolute',
    width: 75,
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 20, 17, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 110, 0.6)',
  },
  objectEmoji: {
    fontSize: 36,
  },
  objectName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 3,
  },
  blast: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -30,
    marginTop: -30,
  },
  blastEmoji: {
    fontSize: 55,
  },
  blastLabel: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    textShadowColor: '#F05A32',
    textShadowRadius: 8,
  },
  roomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 12, 10, 0.72)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  roomFooterText: {
    color: '#F2A18D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 14,
    paddingVertical: 15,
    backgroundColor: '#28201C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A64C30',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  statLabel: {
    color: '#C8B9AE',
    fontSize: 8,
    marginTop: 4,
  },
  separator: {
    width: 1,
    height: 42,
    backgroundColor: '#75432F',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 13,
  },
  categoryList: {
    paddingHorizontal: 14,
  },
  categoryButton: {
    width: 88,
    height: 82,
    backgroundColor: '#29231F',
    borderWidth: 1,
    borderColor: '#72584B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  categoryActive: {
    borderColor: '#F05A32',
    backgroundColor: '#583022',
  },
  categoryEmoji: {
    fontSize: 23,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 7,
  },
  addButton: {
    marginHorizontal: 15,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A64C30',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#F2A18D',
    fontSize: 11,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 18,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F2A18D',
    borderRadius: 11,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  resetText: {
    color: '#F2A18D',
    fontSize: 11,
    fontWeight: '900',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#E45B3C',
    borderRadius: 11,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.4,
  },
  summary: {
    backgroundColor: '#29231F',
    margin: 16,
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 45,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
  },
  summaryDescription: {
    color: '#D0C4B8',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  summaryNumber: {
    color: '#F05A32',
    fontSize: 52,
    fontWeight: '900',
    marginTop: 18,
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    color: '#A69A8F',
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
  },
});
