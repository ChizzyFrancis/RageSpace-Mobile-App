import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  TextInput,
  Alert,
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import RageSpaceScreen from './RageSpaceScreen';
import CalmZoneScreen from './CalmZoneScreen';
import CompanionScreen from './CompanionScreen';
import ProfileScreen from './ProfileScreen';

const MOOD_STORAGE_KEY = '@ragespace_moods';
const JOURNAL_STORAGE_KEY = '@ragespace_journal';
const THEME_STORAGE_KEY = '@ragespace_dark_mode';

const moods = [
  { name: 'Happy', emoji: '😊' },
  { name: 'Calm', emoji: '😌' },
  { name: 'Sad', emoji: '😔' },
  { name: 'Anxious', emoji: '😰' },
  { name: 'Stressed', emoji: '😤' },
  { name: 'Angry', emoji: '😡' },
  { name: 'Tired', emoji: '😴' },
  { name: 'Overwhelmed', emoji: '🥺' },
  { name: 'Okay', emoji: '🙂' },
];

const tabs = [
  { name: 'Home', icon: '⌂' },
  { name: 'Mood', icon: '♡' },
  { name: 'Companion', icon: '✧' },
  { name: 'Journal', icon: '▤' },
  { name: 'History', icon: '◷' },
];

type MoodEntry = {
  id: string;
  moods: string[];
  intensity: number;
  note: string;
  date: string;
};

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  date: string;
  updatedAt: string;
};

type JourneyActivity = 'RageRoom' | 'CalmZone' | 'Companion';
type JourneyStage = 'before' | 'after';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', bio: '', photo: null as string | null });

  useEffect(() => {
    const loadThemeAndProfile = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const savedProfile = await AsyncStorage.getItem('@ragespace_profile');
        if (savedTheme !== null) setDarkMode(savedTheme === 'true');
        if (savedProfile) setProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Could not load appearance/profile:', error);
      }
    };
    loadThemeAndProfile();
  }, []);

  const handleDarkModeChange = async (enabled: boolean) => {
    setDarkMode(enabled);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, String(enabled));
    } catch (error) {
      console.error('Could not save appearance:', error);
    }
  };

  // Mood state
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(3);
  const [moodNote, setMoodNote] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [savedMessage, setSavedMessage] = useState('');

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [journalMode, setJournalMode] = useState<'list' | 'editor' | 'reading'>('list');
  const [storageReady, setStorageReady] = useState(false);

  // Rage Room session
  const [lastRageCount, setLastRageCount] = useState(0);

  // Guided journey state
  const [journeyActive, setJourneyActive] = useState(false);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>('before');
  const [beforeMood, setBeforeMood] = useState<MoodEntry | null>(null);
  const [afterMood, setAfterMood] = useState<MoodEntry | null>(null);
  const [journeyActivity, setJourneyActivity] = useState<JourneyActivity>('CalmZone');

  // Load saved information
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedMoods = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
        const savedJournal = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);

        if (savedMoods) {
          setEntries(JSON.parse(savedMoods));
        }

        if (savedJournal) {
          setJournalEntries(JSON.parse(savedJournal));
        }
      } catch (error) {
        console.error('Error loading saved information:', error);
      } finally {
        setStorageReady(true);
      }
    };

    loadSavedData();
  }, []);

  // Save mood and journal information locally
  useEffect(() => {
    if (!storageReady) return;

    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          MOOD_STORAGE_KEY,
          JSON.stringify(entries)
        );

        await AsyncStorage.setItem(
          JOURNAL_STORAGE_KEY,
          JSON.stringify(journalEntries)
        );
      } catch (error) {
        console.error('Error saving information:', error);
      }
    };

    saveData();
  }, [entries, journalEntries, storageReady]);

  // MOOD FUNCTIONS

  const toggleMood = (mood: string) => {
    setSelectedMoods((previous) =>
      previous.includes(mood)
        ? previous.filter((item) => item !== mood)
        : [...previous, mood]
    );

    setSavedMessage('');
  };

  const saveMood = () => {
    if (selectedMoods.length === 0) {
      setSavedMessage('Please select at least one emotion first.');
      return;
    }

    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      moods: [...selectedMoods],
      intensity,
      note: moodNote.trim(),
      date: new Date().toLocaleString(),
    };

    setEntries((previous) => [newEntry, ...previous]);
    setSelectedMoods([]);
    setIntensity(3);
    setMoodNote('');
    setSavedMessage('Your mood check-in has been saved successfully! ❤️');

    if (journeyActive) {
      if (journeyStage === 'before') {
        setBeforeMood(newEntry);
        setActiveTab('JourneyNext');
      } else {
        setAfterMood(newEntry);
        setActiveTab('JourneyComplete');
      }
    }
  };

  // GUIDED JOURNEY FUNCTIONS

  const startGuidedJourney = () => {
    setJourneyActive(true);
    setJourneyStage('before');
    setBeforeMood(null);
    setAfterMood(null);
    setSelectedMoods([]);
    setIntensity(3);
    setMoodNote('');
    setSavedMessage('');
    setActiveTab('Mood');
  };

  const startJourneyActivity = (activity: JourneyActivity) => {
    setJourneyActivity(activity);
    setActiveTab(activity);
  };

  const returnFromJourneyActivity = () => {
    setActiveTab(journeyActive ? 'PostActivity' : 'Home');
  };

  const continueAfterActivity = () => {
    setJourneyStage('after');
    setSelectedMoods([]);
    setIntensity(3);
    setMoodNote('');
    setSavedMessage('');
    setActiveTab('Mood');
  };

  const finishGuidedJourney = () => {
    setJourneyActive(false);
    setJourneyStage('before');
    setBeforeMood(null);
    setAfterMood(null);
    setActiveTab('Home');
  };

  const getRecommendedActivity = (): JourneyActivity => {
    const currentMoods = beforeMood?.moods ?? [];

    if (currentMoods.includes('Angry')) return 'RageRoom';
    if (currentMoods.includes('Sad')) return 'Companion';

    if (
      currentMoods.some((mood) =>
        ['Anxious', 'Overwhelmed', 'Tired', 'Stressed'].includes(mood)
      )
    ) {
      return 'CalmZone';
    }

    return 'CalmZone';
  };

  const activityNames: Record<JourneyActivity, string> = {
    RageRoom: 'Rage Room',
    CalmZone: 'Calm Zone',
    Companion: 'AI Companion',
  };

  const activityDescriptions: Record<JourneyActivity, string> = {
    RageRoom: 'Release some energy in your virtual space. You can smash virtual objects at your own pace.',
    CalmZone: 'Slow down with a calming activity and give yourself a moment to reset.',
    Companion: 'Talk through what is on your mind with the guided companion experience.',
  };

  // JOURNAL FUNCTIONS

  const openNewJournal = () => {
    setSelectedJournalId(null);
    setJournalTitle('');
    setJournalContent('');
    setJournalMode('editor');
  };

  const openJournalEntry = (entry: JournalEntry) => {
    setSelectedJournalId(entry.id);
    setJournalTitle(entry.title);
    setJournalContent(entry.content);
    setJournalMode('reading');
  };

  const editJournalEntry = () => {
    setJournalMode('editor');
  };

  const saveJournalEntry = () => {
    const title = journalTitle.trim();
    const content = journalContent.trim();

    if (!title || !content) {
      Alert.alert(
        'Incomplete entry',
        'Please add both a title and your thoughts before saving.'
      );
      return;
    }

    const now = new Date().toLocaleString();

    if (selectedJournalId) {
      setJournalEntries((previous) =>
        previous.map((entry) =>
          entry.id === selectedJournalId
            ? { ...entry, title, content, updatedAt: now }
            : entry
        )
      );
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        title,
        content,
        date: now,
        updatedAt: now,
      };

      setJournalEntries((previous) => [newEntry, ...previous]);
    }

    setJournalMode('list');
    setSelectedJournalId(null);
    setJournalTitle('');
    setJournalContent('');

    Alert.alert('Saved ❤️', 'Your journal entry has been saved.');
  };

  const deleteJournalEntry = (id: string) => {
    Alert.alert(
      'Delete journal entry?',
      'This entry will be permanently deleted from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setJournalEntries((previous) =>
              previous.filter((entry) => entry.id !== id)
            );

            setSelectedJournalId(null);
            setJournalMode('list');
            setJournalTitle('');
            setJournalContent('');
          },
        },
      ]
    );
  };

  // HEADER

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.logo, darkMode && { color: '#F3F0E9' }]}>RAGESPACE.</Text>
        <Text style={styles.tagline}>YOUR SPACE. YOUR FEELINGS.</Text>
      </View>

      <Pressable
        style={styles.avatar}
        onPress={() => setActiveTab('Profile')}
      >
        {profile.photo ? (
          <Image
            source={{ uri: profile.photo }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarText}>
            {profile.name?.trim()
              ? profile.name.trim().charAt(0).toUpperCase()
              : 'R'}
          </Text>
        )}
      </Pressable>
    </View>
  );

  // HOME SCREEN

  const renderHome = () => (
    <>
      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>A SPACE JUST FOR YOU</Text>

        <Text style={[styles.heading, darkMode && { color: '#F3F0E9' }]}>
          Find your space.{'\n'}
          <Text style={styles.accent}>Whatever you're feeling.</Text>
        </Text>

        <Text style={[styles.description, darkMode && { color: '#B9BEB7' }]}>
          Take a moment for yourself. Let it out, slow down,
          or simply check in with how you're feeling today.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.journeyStartButton,
          pressed && { opacity: 0.85 },
        ]}
        onPress={startGuidedJourney}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.journeyStartLabel}>YOUR GUIDED EXPERIENCE</Text>
          <Text style={styles.journeyStartTitle}>Start my journey</Text>
          <Text style={styles.journeyStartDescription}>
            Check in, release, reset and reflect.
          </Text>
        </View>
        <Text style={styles.journeyStartArrow}>→</Text>
      </Pressable>

      <View style={styles.moodSection}>
        <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
          How are you feeling?
        </Text>

        <Text style={[styles.sectionSubtitle, darkMode && { color: '#B9BEB7' }]}>
          Choose what best describes your mood right now.
        </Text>

        <View style={styles.moodGrid}>
          {moods.slice(0, 6).map((mood) => (
            <Pressable
              key={mood.name}
              onPress={() => {
                toggleMood(mood.name);
                setActiveTab('Mood');
              }}
              style={[
                styles.moodButton,
                selectedMoods.includes(mood.name) && styles.moodSelected,
              ]}
            >
              <Text style={styles.moodText}>
                {mood.emoji} {mood.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.rageCard}>
        <Text style={styles.cardLabel}>LET IT OUT</Text>

        <Text style={styles.rageTitle}>
          Need to release some energy?
        </Text>

        <Text style={styles.cardDescription}>
          Step into your virtual space and let the frustration out.
        </Text>

        <Text style={styles.bigEmoji}>💥</Text>

        <Pressable
          style={styles.rageButton}
          onPress={() => setActiveTab('RageRoom')}
        >
          <Text style={styles.rageButtonText}>
            VIRTUAL RAGE ROOM →
          </Text>
        </Pressable>
      </View>

      <View style={styles.secondaryCards}>
        <Pressable
          style={styles.calmCard}
          onPress={() => setActiveTab('CalmZone')}
        >
          <Text style={styles.cardEmoji}>🌿</Text>
          <Text style={styles.smallCardTitle}>Calm Zone</Text>
          <Text style={styles.smallCardDescription}>
            Breathe, relax and reset.
          </Text>
        </Pressable>

        <Pressable
          style={styles.journalCard}
          onPress={() => {
            setJournalMode('list');
            setActiveTab('Journal');
          }}
        >
          <Text style={styles.cardEmoji}>📖</Text>
          <Text style={styles.smallCardTitle}>My Journal</Text>
          <Text style={styles.smallCardDescription}>
            Your thoughts, your space.
          </Text>
        </Pressable>
      </View>

      {lastRageCount > 0 && (
        <View style={styles.lastSession}>
          <Text style={styles.smallCardTitle}>
            Your last Rage Room session
          </Text>

          <Text style={styles.smallCardDescription}>
            You smashed {lastRageCount} objects. Take a moment for yourself.
          </Text>
        </View>
      )}

      {savedMessage !== '' && (
        <Text style={styles.notice}>{savedMessage}</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          RAGESPACE · A LITTLE SPACE TO FEEL BETTER
        </Text>
      </View>
    </>
  );

  // MOOD SCREEN

  const renderMood = () => (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>
        {journeyActive
          ? (journeyStage === 'before'
            ? 'YOUR JOURNEY · BEFORE'
            : 'YOUR JOURNEY · AFTER')
          : 'YOUR EMOTIONAL SPACE'}
      </Text>

      <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
        {journeyActive
          ? (journeyStage === 'before'
            ? 'How are you feeling right now?'
            : 'How are you feeling now?')
          : 'Check in with yourself.'}
      </Text>

      <Text style={[styles.screenDescription, darkMode && { color: '#B9BEB7' }]}>
        {journeyActive && journeyStage === 'after'
          ? 'You have had some time in your chosen activity. Check in again and notice whether anything feels different.'
          : "There is no right or wrong way to feel. Choose all the emotions that describe how you're feeling right now."}
      </Text>

      <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
        What are you feeling?
      </Text>

      <View style={styles.moodGrid}>
        {moods.map((mood) => {
          const selected = selectedMoods.includes(mood.name);

          return (
            <Pressable
              key={mood.name}
              onPress={() => toggleMood(mood.name)}
              style={[
                styles.moodButton,
                selected && styles.moodSelected,
              ]}
            >
              <Text
                style={[
                  styles.moodText,
                  selected && styles.moodTextSelected,
                ]}
              >
                {mood.emoji} {mood.name}
                {selected ? ' ✓' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
          How intense is it?
        </Text>

        <Text style={[styles.sectionSubtitle, darkMode && { color: '#B9BEB7' }]}>
          Choose how strongly you're experiencing these emotions.
        </Text>

        <View style={styles.intensityRow}>
          {[1, 2, 3, 4, 5].map((level) => (
            <Pressable
              key={level}
              onPress={() => setIntensity(level)}
              style={[
                styles.intensityButton,
                intensity === level && styles.intensitySelected,
              ]}
            >
              <Text
                style={[
                  styles.intensityNumber,
                  intensity === level && styles.intensityNumberSelected,
                ]}
              >
                {level}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.intensityLabels}>
          <Text style={styles.smallMuted}>A little</Text>
          <Text style={styles.smallMuted}>Very strong</Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
          Anything on your mind?
        </Text>

        <Text style={[styles.sectionSubtitle, darkMode && { color: '#B9BEB7' }]}>
          This is optional. Write a little about what's happening.
        </Text>

        <TextInput
          style={styles.noteInput}
          placeholder="Write your thoughts here..."
          placeholderTextColor="#99958D"
          multiline
          textAlignVertical="top"
          value={moodNote}
          onChangeText={(text) => {
            setMoodNote(text);
            setSavedMessage('');
          }}
          maxLength={1000}
        />

        <Text style={styles.characterCount}>
          {moodNote.length}/1000
        </Text>
      </View>

      <Pressable style={styles.saveButton} onPress={saveMood}>
        <Text style={styles.saveButtonText}>
          {journeyActive ? 'SAVE AND CONTINUE →' : 'SAVE MY CHECK-IN →'}
        </Text>
      </Pressable>

      {journeyActive && (
        <Pressable
          style={styles.textButton}
          onPress={() => {
            setJourneyActive(false);
            setActiveTab('Home');
          }}
        >
          <Text style={styles.textButtonText}>EXIT GUIDED JOURNEY</Text>
        </Pressable>
      )}

      {savedMessage !== '' && (
        <Text style={styles.notice}>{savedMessage}</Text>
      )}

      <Text style={styles.privacyNote}>
        Your feelings matter. You can choose what to share.
      </Text>
    </View>
  );

  // JOURNAL SCREEN

  const renderJournal = () => {
    if (!storageReady) {
      return (
        <View style={styles.screen}>
          <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
            Loading your journal...
          </Text>
        </View>
      );
    }

    if (journalMode === 'editor') {
      return (
        <View style={styles.screen}>
          <Pressable
            style={styles.backButton}
            onPress={() => setJournalMode('list')}
          >
            <Text style={styles.backButtonText}>← BACK TO JOURNAL</Text>
          </Pressable>

          <Text style={styles.eyebrow}>YOUR PRIVATE SPACE</Text>

          <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
            {selectedJournalId ? 'Edit your entry.' : 'A page just for you.'}
          </Text>

          <Text style={[styles.screenDescription, darkMode && { color: '#B9BEB7' }]}>
            Write freely. This is your space to express yourself.
          </Text>

          <Text style={styles.inputLabel}>ENTRY TITLE</Text>

          <TextInput
            style={styles.titleInput}
            placeholder="Give your entry a title..."
            placeholderTextColor="#99958D"
            value={journalTitle}
            onChangeText={setJournalTitle}
            maxLength={80}
          />

          <Text style={styles.inputLabel}>YOUR THOUGHTS</Text>

          <TextInput
            style={styles.journalInput}
            placeholder="What's on your mind today? Start writing..."
            placeholderTextColor="#99958D"
            value={journalContent}
            onChangeText={setJournalContent}
            multiline
            textAlignVertical="top"
            maxLength={10000}
          />

          <View style={styles.voiceTip}>
            <Text style={styles.voiceTipEmoji}>🎙️</Text>
            <Text style={styles.voiceTipText}>
              Prefer speaking? Tap the microphone on your iPhone keyboard
              to dictate your thoughts directly into your journal.
            </Text>
          </View>

          <Text style={styles.characterCount}>
            {journalContent.length}/10000
          </Text>

          <Pressable
            style={styles.saveButton}
            onPress={saveJournalEntry}
          >
            <Text style={styles.saveButtonText}>SAVE MY ENTRY →</Text>
          </Pressable>

          <Text style={styles.privacyNote}>
            Your journal is stored locally on this device.
          </Text>
        </View>
      );
    }

    if (journalMode === 'reading') {
      const entry = journalEntries.find(
        (item) => item.id === selectedJournalId
      );

      if (!entry) {
        return (
          <View style={styles.screen}>
            <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
              This entry could not be found.
            </Text>

            <Pressable
              style={styles.saveButton}
              onPress={() => setJournalMode('list')}
            >
              <Text style={styles.saveButtonText}>BACK TO JOURNAL</Text>
            </Pressable>
          </View>
        );
      }

      return (
        <View style={styles.screen}>
          <Pressable
            style={styles.backButton}
            onPress={() => setJournalMode('list')}
          >
            <Text style={styles.backButtonText}>← BACK TO JOURNAL</Text>
          </Pressable>

          <Text style={styles.eyebrow}>YOUR JOURNAL ENTRY</Text>

          <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
            {entry.title}
          </Text>

          <Text style={styles.historyDate}>
            Created: {entry.date}
          </Text>

          {entry.updatedAt !== entry.date && (
            <Text style={styles.historyDate}>
              Last updated: {entry.updatedAt}
            </Text>
          )}

          <View style={styles.readingCard}>
            <Text style={styles.readingText}>{entry.content}</Text>
          </View>

          <Pressable
            style={styles.saveButton}
            onPress={editJournalEntry}
          >
            <Text style={styles.saveButtonText}>EDIT ENTRY →</Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() => deleteJournalEntry(entry.id)}
          >
            <Text style={styles.deleteButtonText}>DELETE ENTRY</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.screen}>
        <Text style={styles.eyebrow}>YOUR PRIVATE SPACE</Text>

        <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
          Your thoughts. Your story.
        </Text>

        <Text style={[styles.screenDescription, darkMode && { color: '#B9BEB7' }]}>
          A place to write, reflect and express whatever is on your mind.
        </Text>

        <Pressable
          style={styles.newEntryButton}
          onPress={openNewJournal}
        >
          <Text style={styles.newEntryEmoji}>＋</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.newEntryTitle}>Write a new entry</Text>
            <Text style={styles.newEntrySubtitle}>
              Start with whatever is on your mind.
            </Text>
          </View>

          <Text style={styles.newEntryArrow}>→</Text>
        </Pressable>

        <View style={styles.journalHeadingRow}>
          <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
            My entries
          </Text>
          <Text style={styles.entryCount}>
            {journalEntries.length} saved
          </Text>
        </View>

        {journalEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.otherEmoji}>📖</Text>

            <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
              Your story starts here.
            </Text>

            <Text style={[styles.sectionSubtitle, darkMode && { color: '#B9BEB7' }]}>
              Your journal entries will appear here after you save them.
            </Text>

            <Pressable
              style={styles.saveButton}
              onPress={openNewJournal}
            >
              <Text style={styles.saveButtonText}>
                WRITE MY FIRST ENTRY →
              </Text>
            </Pressable>
          </View>
        ) : (
          journalEntries.map((entry) => (
            <Pressable
              key={entry.id}
              style={styles.journalEntryCard}
              onPress={() => openJournalEntry(entry)}
            >
              <View style={styles.entryTopRow}>
                <Text style={styles.entryIcon}>📖</Text>
                <Text style={styles.historyDate}>{entry.date}</Text>
              </View>

              <Text style={styles.entryTitle}>{entry.title}</Text>

              <Text style={styles.entryPreview} numberOfLines={3}>
                {entry.content}
              </Text>

              <Text style={styles.readEntry}>READ ENTRY →</Text>
            </Pressable>
          ))
        )}

        <Text style={styles.privacyNote}>
          Your journal is stored locally on this device.
        </Text>
      </View>
    );
  };

  // HISTORY SCREEN

  const renderHistory = () => (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>YOUR PERSONAL JOURNEY</Text>

      <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
        Your journey matters.
      </Text>

      <Text style={[styles.screenDescription, darkMode && { color: '#B9BEB7' }]}>
        Your saved mood check-ins will appear here.
      </Text>

      <View style={styles.historySummary}>
        <Text style={styles.summaryNumber}>{entries.length}</Text>
        <Text style={styles.summaryLabel}>Saved mood check-ins</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.otherEmoji}>🌱</Text>

          <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
            Your story starts here.
          </Text>

          <Text style={[styles.sectionSubtitle, darkMode && { color: '#B9BEB7' }]}>
            Complete your first mood check-in and it will appear here.
          </Text>

          <Pressable
            style={styles.saveButton}
            onPress={() => setActiveTab('Mood')}
          >
            <Text style={styles.saveButtonText}>CHECK IN NOW →</Text>
          </Pressable>
        </View>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.historyCard}>
            <Text style={styles.historyDate}>{entry.date}</Text>

            <Text style={styles.historyMoods}>
              {entry.moods.join(' · ')}
            </Text>

            <Text style={styles.historyDetail}>
              Intensity: {entry.intensity}/5
            </Text>

            {entry.note !== '' && (
              <Text style={styles.historyNote}>{entry.note}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );
    // GUIDED JOURNEY SCREENS

  const renderJourneyNext = () => {
    const recommended = getRecommendedActivity();

    return (
      <View style={styles.screen}>
        <Text style={styles.eyebrow}>YOUR JOURNEY · STEP 2</Text>

        <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
          Choose what feels right.
        </Text>

        <Text style={[styles.screenDescription, darkMode && { color: '#B9BEB7' }]}>
          Based on your first check-in, here is one activity you could try.
          You are always free to choose something else.
        </Text>

        <View style={styles.journeyRecommendation}>
          <Text style={styles.journeyRecommendationLabel}>
            SUGGESTED FOR YOU
          </Text>

          <Text style={styles.journeyRecommendationTitle}>
            {activityNames[recommended]}
          </Text>

          <Text style={styles.journeyRecommendationDescription}>
            {activityDescriptions[recommended]}
          </Text>

          <Pressable
            style={styles.saveButton}
            onPress={() => startJourneyActivity(recommended)}
          >
            <Text style={styles.saveButtonText}>
              START {activityNames[recommended].toUpperCase()} →
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, darkMode && { color: '#F3F0E9' }]}>
          Or choose another activity
        </Text>

        {(['RageRoom', 'CalmZone', 'Companion'] as JourneyActivity[])
          .filter((item) => item !== recommended)
          .map((item) => (
            <Pressable
              key={item}
              style={styles.journeyChoice}
              onPress={() => startJourneyActivity(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.journeyChoiceTitle}>
                  {activityNames[item]}
                </Text>

                <Text style={styles.journeyChoiceDescription}>
                  {activityDescriptions[item]}
                </Text>
              </View>

              <Text style={styles.journeyChoiceArrow}>→</Text>
            </Pressable>
          ))}

        <Pressable
          style={styles.textButton}
          onPress={finishGuidedJourney}
        >
          <Text style={styles.textButtonText}>END JOURNEY</Text>
        </Pressable>
      </View>
    );
  };

  const renderPostActivity = () => (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>YOUR JOURNEY · STEP 3</Text>

      <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
        How was that for you?
      </Text>

      <Text style={[styles.screenDescription, darkMode && { color: '#B9BEB7' }]}>
        You completed {activityNames[journeyActivity]}. Take a moment and
        decide what you would like to do next.
      </Text>

      <View style={styles.journeyRecommendation}>
        <Text style={styles.journeyRecommendationLabel}>
          YOUR LAST ACTIVITY
        </Text>

        <Text style={styles.journeyRecommendationTitle}>
          {activityNames[journeyActivity]}
        </Text>

        <Text style={styles.journeyRecommendationDescription}>
          {activityDescriptions[journeyActivity]}
        </Text>
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={() => startJourneyActivity(journeyActivity)}
      >
        <Text style={styles.saveButtonText}>DO IT AGAIN →</Text>
      </Pressable>

      <Pressable
        style={styles.journeyChoice}
        onPress={() => setActiveTab('JourneyNext')}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.journeyChoiceTitle}>
            Choose a different activity
          </Text>

          <Text style={styles.journeyChoiceDescription}>
            Try another RageSpace experience.
          </Text>
        </View>

        <Text style={styles.journeyChoiceArrow}>→</Text>
      </Pressable>

      <Pressable
        style={styles.journeyChoice}
        onPress={continueAfterActivity}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.journeyChoiceTitle}>
            Check in with myself
          </Text>

          <Text style={styles.journeyChoiceDescription}>
            Record how you feel after the activity.
          </Text>
        </View>

        <Text style={styles.journeyChoiceArrow}>→</Text>
      </Pressable>

      <Pressable
        style={styles.textButton}
        onPress={finishGuidedJourney}
      >
        <Text style={styles.textButtonText}>FINISH JOURNEY</Text>
      </Pressable>
    </View>
  );

  const renderJourneyComplete = () => (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>YOUR JOURNEY · COMPLETE</Text>

      <Text style={[styles.screenTitle, darkMode && { color: '#F3F0E9' }]}>
        You made space for yourself.
      </Text>

      <Text style={[styles.screenDescription, darkMode && { color: '#B9BEB7' }]}>
        There is no score and no right result. Notice what changed,
        or what stayed the same.
      </Text>

      <View style={styles.journeyMoodCard}>
        <Text style={styles.journeyRecommendationLabel}>
          BEFORE YOUR ACTIVITY
        </Text>

        <Text style={styles.journeyMoodTitle}>
          {beforeMood?.moods.join(' · ') ?? 'Not recorded'}
        </Text>

        {beforeMood && (
          <Text style={styles.journeyMoodDetail}>
            Intensity: {beforeMood.intensity}/5
          </Text>
        )}

        {beforeMood?.note ? (
          <Text style={styles.journeyMoodDetail}>
            {beforeMood.note}
          </Text>
        ) : null}
      </View>

      <View style={styles.journeyMoodCard}>
        <Text style={styles.journeyRecommendationLabel}>
          AFTER YOUR ACTIVITY
        </Text>

        <Text style={styles.journeyMoodTitle}>
          {afterMood?.moods.join(' · ') ?? 'Not recorded'}
        </Text>

        {afterMood && (
          <Text style={styles.journeyMoodDetail}>
            Intensity: {afterMood.intensity}/5
          </Text>
        )}

        {afterMood?.note ? (
          <Text style={styles.journeyMoodDetail}>
            {afterMood.note}
          </Text>
        ) : null}
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={() => {
          setSelectedJournalId(null);
          setJournalTitle('My RageSpace reflection');

          setJournalContent(
            'My first check-in: ' +
            (beforeMood?.moods.join(', ') ?? 'Not recorded') +
            '\nIntensity: ' +
            (beforeMood?.intensity ?? '-') +
            '/5\n\nActivity: ' +
            activityNames[journeyActivity] +
            '\n\nMy second check-in: ' +
            (afterMood?.moods.join(', ') ?? 'Not recorded') +
            '\nIntensity: ' +
            (afterMood?.intensity ?? '-') +
            '/5\n\nMy reflection: '
          );

          setJournalMode('editor');
          setJourneyActive(false);
          setActiveTab('Journal');
        }}
      >
        <Text style={styles.saveButtonText}>
          WRITE A JOURNAL REFLECTION →
        </Text>
      </Pressable>

      <Pressable
        style={styles.textButton}
        onPress={finishGuidedJourney}
      >
        <Text style={styles.textButtonText}>RETURN HOME</Text>
      </Pressable>
    </View>
  );

  // SCREEN NAVIGATION

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return renderHome();

      case 'Mood':
        return renderMood();

      case 'Journal':
        return renderJournal();

      case 'History':
        return renderHistory();

      case 'JourneyNext':
        return renderJourneyNext();

      case 'PostActivity':
        return renderPostActivity();

      case 'JourneyComplete':
        return renderJourneyComplete();

      case 'RageRoom':
        return (
          <RageSpaceScreen
            onBack={returnFromJourneyActivity}
            onFinish={(count) => setLastRageCount(count)}
          />
        );

      case 'CalmZone':
        return (
          <CalmZoneScreen
            onBack={returnFromJourneyActivity}
          />
        );

      case 'Companion':
        return (
          <CompanionScreen
            onBack={returnFromJourneyActivity}
            darkMode={darkMode}
          />
        );

      case 'Profile':
        return (
          <ProfileScreen
            onBack={() => setActiveTab('Home')}
            onProfileChange={setProfile}
            darkMode={darkMode}
            onDarkModeChange={handleDarkModeChange}
          />
        );

      default:
        return renderHome();
    }
  };

  // MAIN APP LAYOUT

  const fullScreenTabs = [
    'RageRoom',
    'CalmZone',
    'Companion',
    'Profile',
  ];

  const isFullScreen = fullScreenTabs.includes(activeTab);

  return (
    <SafeAreaView
      style={[
        styles.container,
        darkMode && { backgroundColor: '#171A18' },
      ]}
    >
      <StatusBar
        barStyle={
          darkMode || activeTab === 'RageRoom'
            ? 'light-content'
            : 'dark-content'
        }
      />

      {!isFullScreen && renderHeader()}

      {isFullScreen ? (
        renderScreen()
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderScreen()}
        </ScrollView>
      )}

      {!isFullScreen && (
        <View
          style={[
            styles.bottomNav,
            darkMode && {
              backgroundColor: '#202521',
              borderTopColor: '#39413B',
            },
          ]}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.name}
              style={styles.navItem}
              onPress={() => {
                if (tab.name === 'Journal') {
                  setJournalMode('list');
                }

                setActiveTab(tab.name);
                setSavedMessage('');
              }}
            >
              <Text
                style={[
                  styles.navIcon,
                  activeTab === tab.name && styles.activeNavIcon,
                ]}
              >
                {tab.icon}
              </Text>

              <Text
                style={[
                  styles.navLabel,
                  activeTab === tab.name && styles.activeNavLabel,
                ]}
              >
                {tab.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3ED',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#292B29',
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#89877F',
    marginTop: 4,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#E7DED1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#292B29',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  welcome: {
    paddingHorizontal: 24,
    marginTop: 30,
    marginBottom: 30,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
    color: '#E45B3C',
    marginBottom: 13,
  },
  heading: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    color: '#292B29',
  },
  accent: {
    color: '#E45B3C',
  },
  description: {
    fontSize: 14,
    lineHeight: 23,
    color: '#77756F',
    marginTop: 14,
  },
  moodSection: {
    paddingHorizontal: 24,
    marginBottom: 27,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#292B29',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 19,
    color: '#89877F',
    marginTop: 6,
    marginBottom: 17,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodButton: {
    width: '31%',
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE7DF',
  },
  moodSelected: {
    backgroundColor: '#FCE5DE',
    borderColor: '#E45B3C',
  },
  moodText: {
    fontSize: 12,
    color: '#44443F',
    fontWeight: '600',
  },
  moodTextSelected: {
    color: '#B94128',
  },
  rageCard: {
    marginHorizontal: 24,
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#292B29',
    overflow: 'hidden',
  },
  cardLabel: {
    color: '#F2A18D',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  rageTitle: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 13,
    width: '75%',
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 20,
    color: '#D1CEC7',
    marginTop: 9,
    width: '75%',
  },
  bigEmoji: {
    position: 'absolute',
    right: 17,
    top: 35,
    fontSize: 57,
  },
  rageButton: {
    backgroundColor: '#E45B3C',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 9,
    marginTop: 22,
  },
  rageButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  secondaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 17,
  },
  calmCard: {
    flex: 1,
    backgroundColor: '#E6EBDD',
    padding: 17,
    borderRadius: 16,
    minHeight: 145,
  },
  journalCard: {
    flex: 1,
    backgroundColor: '#EDE4D9',
    padding: 17,
    borderRadius: 16,
    minHeight: 145,
  },
  cardEmoji: {
    fontSize: 26,
    marginBottom: 13,
  },
  smallCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#292B29',
  },
  smallCardDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: '#77756F',
    marginTop: 6,
  },
  lastSession: {
    marginHorizontal: 24,
    marginTop: 18,
    padding: 16,
    backgroundColor: '#EDE4D9',
    borderRadius: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#99958D',
  },
  screen: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 35,
  },
  screenTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    color: '#292B29',
  },
  screenDescription: {
    fontSize: 14,
    lineHeight: 23,
    color: '#77756F',
    marginTop: 12,
    marginBottom: 30,
  },
  sectionBlock: {
    marginTop: 30,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  intensityButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE7DF',
  },
  intensitySelected: {
    backgroundColor: '#E45B3C',
    borderColor: '#E45B3C',
  },
  intensityNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#44443F',
  },
  intensityNumberSelected: {
    color: '#FFFFFF',
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  smallMuted: {
    fontSize: 11,
    color: '#89877F',
  },
  noteInput: {
    minHeight: 125,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE7DF',
    borderRadius: 14,
    padding: 15,
    fontSize: 14,
    color: '#292B29',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 10,
    color: '#89877F',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#E45B3C',
    paddingVertical: 17,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 25,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  notice: {
    fontSize: 13,
    lineHeight: 21,
    color: '#B94128',
    fontWeight: '600',
    marginTop: 15,
  },
  privacyNote: {
    textAlign: 'center',
    color: '#89877F',
    fontSize: 11,
    marginTop: 18,
  },
  historySummary: {
    backgroundColor: '#292B29',
    borderRadius: 17,
    padding: 22,
    marginBottom: 22,
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#D1CEC7',
    marginTop: 5,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 22,
    marginTop: 10,
  },
  otherEmoji: {
    fontSize: 48,
    marginBottom: 18,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EBE7DF',
  },
  historyDate: {
    fontSize: 10,
    color: '#89877F',
    marginBottom: 10,
  },
  historyMoods: {
    fontSize: 17,
    fontWeight: '800',
    color: '#292B29',
  },
  historyDetail: {
    fontSize: 12,
    color: '#B94128',
    marginTop: 9,
  },
  historyNote: {
    fontSize: 13,
    lineHeight: 21,
    color: '#77756F',
    marginTop: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B94128',
    letterSpacing: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B94128',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 10,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EBE7DF',
    padding: 16,
    fontSize: 15,
    fontWeight: '700',
    color: '#292B29',
  },
  journalInput: {
    minHeight: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EBE7DF',
    padding: 16,
    fontSize: 14,
    lineHeight: 23,
    color: '#292B29',
  },
  voiceTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0ECE4',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  voiceTipEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  voiceTipText: {
    flex: 1,
    color: '#77756F',
    fontSize: 11,
    lineHeight: 17,
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292B29',
    padding: 19,
    borderRadius: 16,
    marginBottom: 28,
  },
  newEntryEmoji: {
    color: '#F2A18D',
    fontSize: 30,
    marginRight: 15,
  },
  newEntryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  newEntrySubtitle: {
    fontSize: 11,
    color: '#D1CEC7',
    marginTop: 5,
  },
  newEntryArrow: {
    fontSize: 23,
    color: '#F2A18D',
  },
  journalHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  entryCount: {
    fontSize: 11,
    color: '#89877F',
  },
  journalEntryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EBE7DF',
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  entryIcon: {
    fontSize: 21,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#292B29',
    marginBottom: 8,
  },
  entryPreview: {
    fontSize: 12,
    lineHeight: 20,
    color: '#77756F',
  },
  readEntry: {
    fontSize: 10,
    color: '#E45B3C',
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 15,
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EBE7DF',
    marginTop: 10,
  },
  readingText: {
    fontSize: 14,
    lineHeight: 25,
    color: '#44443F',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#D85A4B',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#B94128',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },

  // GUIDED JOURNEY STYLES

  journeyStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292B29',
    marginHorizontal: 24,
    marginBottom: 28,
    padding: 20,
    borderRadius: 18,
  },
  journeyStartLabel: {
    color: '#F2A18D',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  journeyStartTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
  journeyStartDescription: {
    color: '#D1CEC7',
    fontSize: 11,
    marginTop: 6,
  },
  journeyStartArrow: {
    color: '#F2A18D',
    fontSize: 30,
    fontWeight: '800',
    marginLeft: 10,
  },
  journeyRecommendation: {
    backgroundColor: '#E6EBDD',
    borderRadius: 17,
    padding: 20,
    marginBottom: 25,
  },
  journeyRecommendationLabel: {
    color: '#657B61',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  journeyRecommendationTitle: {
    color: '#292B29',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 8,
  },
  journeyRecommendationDescription: {
    color: '#657064',
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 5,
  },
  journeyChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9E3D9',
    padding: 16,
    marginBottom: 12,
  },
  journeyChoiceTitle: {
    color: '#292B29',
    fontSize: 15,
    fontWeight: '800',
  },
  journeyChoiceDescription: {
    color: '#77756F',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  journeyChoiceArrow: {
    color: '#E45B3C',
    fontSize: 23,
    marginLeft: 10,
  },
  journeyMoodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EBE7DF',
    padding: 18,
    marginBottom: 14,
  },
  journeyMoodTitle: {
    color: '#292B29',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  journeyMoodDetail: {
    color: '#77756F',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  textButton: {
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
    marginBottom: 12,
  },
  textButtonText: {
    color: '#E45B3C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE7DF',
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    fontSize: 23,
    color: '#99958D',
  },
  activeNavIcon: {
    color: '#E45B3C',
  },
  navLabel: {
    fontSize: 9,
    color: '#99958D',
  },
  activeNavLabel: {
    color: '#E45B3C',
    fontWeight: '800',
  },
});