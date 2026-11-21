
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const PROFILE_STORAGE_KEY = '@ragespace_profile';

type ProfileData = {
  name: string;
  email: string;
  bio: string;
  photo: string | null;
};

type Props = {
  onBack: () => void;
  onProfileChange: (profile: ProfileData) => void;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
};

const defaultProfile: ProfileData = {
  name: '',
  email: '',
  bio: '',
  photo: null,
};

export default function ProfileScreen({
  onBack,
  onProfileChange,
  darkMode,
  onDarkModeChange,
}: Props) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

        if (saved) {
          setProfile({ ...defaultProfile, ...JSON.parse(saved) });
        }
      } catch (error) {
        console.log('Could not load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateField = (field: keyof ProfileData, value: string | null) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const choosePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow RageSpace to access your photo library.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        updateField('photo', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Unable to open photos', 'Please try again.');
    }
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    try {
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(profile)
      );

      onProfileChange(profile);
      setEditing(false);
      Alert.alert('Profile saved ❤️', 'Your changes have been saved.');
    } catch (error) {
      Alert.alert('Save failed', 'Your profile could not be saved.');
    }
  };

  const initials = profile.name.trim()
    ? profile.name.trim().charAt(0).toUpperCase()
    : 'R';

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.heading}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, darkMode && styles.containerDark]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
        onPress={onBack}
      >
        <Text style={styles.backText}>← BACK</Text>
      </Pressable>

      <Text style={styles.eyebrow}>YOUR PERSONAL SPACE</Text>

      <Text style={[styles.heading, darkMode && styles.textDark]}>
        My Profile.
      </Text>

      <Text style={[styles.description, darkMode && styles.mutedDark]}>
        Make RageSpace feel a little more like yours.
      </Text>

      <View style={[styles.profileCard, darkMode && styles.cardDark]}>
        <Pressable
          style={styles.photoContainer}
          onPress={editing ? choosePhoto : undefined}
        >
          {profile.photo ? (
            <Image source={{ uri: profile.photo }} style={styles.photo} />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}

          {editing && (
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraText}>📷</Text>
            </View>
          )}
        </Pressable>

        <Text style={[styles.profileName, darkMode && styles.textDark]}>
          {profile.name.trim() || 'Your name'}
        </Text>

        <Text style={[styles.profileEmail, darkMode && styles.mutedDark]}>
          {profile.email.trim() || 'Add your email address'}
        </Text>

        {editing && (
          <Pressable onPress={choosePhoto}>
            <Text style={styles.changePhoto}>CHANGE PROFILE PHOTO</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>
          Personal information
        </Text>

        {!editing && (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.editText}>EDIT</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.formCard, darkMode && styles.cardDark]}>
        <Text style={styles.label}>FULL NAME</Text>

        <TextInput
          style={[styles.input, darkMode && styles.inputDark]}
          value={profile.name}
          onChangeText={(value) => updateField('name', value)}
          placeholder="Enter your name"
          placeholderTextColor="#99958D"
          editable={editing}
        />

        <Text style={styles.label}>EMAIL ADDRESS</Text>

        <TextInput
          style={[styles.input, darkMode && styles.inputDark]}
          value={profile.email}
          onChangeText={(value) => updateField('email', value)}
          placeholder="Enter your email"
          placeholderTextColor="#99958D"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={editing}
        />

        <Text style={styles.label}>ABOUT ME</Text>

        <TextInput
          style={[
            styles.input,
            styles.bioInput,
            darkMode && styles.inputDark,
          ]}
          value={profile.bio}
          onChangeText={(value) => updateField('bio', value)}
          placeholder="Tell us a little about yourself..."
          placeholderTextColor="#99958D"
          multiline
          textAlignVertical="top"
          editable={editing}
          maxLength={250}
        />

        {editing && (
          <>
            <Text style={styles.characterCount}>
              {profile.bio.length}/250
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
              ]}
              onPress={saveProfile}
            >
              <Text style={styles.saveButtonText}>
                SAVE CHANGES →
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setEditing(false)}
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>
        Preferences
      </Text>

      <View style={[styles.settingsCard, darkMode && styles.cardDark]}>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, darkMode && styles.textDark]}>
              Notifications
            </Text>

            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.mutedDark,
              ]}
            >
              Control your app notification preference.
            </Text>
          </View>

          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#D5D1C9', true: '#E45B3C' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, darkMode && styles.textDark]}>
              Dark appearance
            </Text>

            <Text
              style={[
                styles.settingDescription,
                darkMode && styles.mutedDark,
              ]}
            >
              Choose your preferred appearance.
            </Text>
          </View>

          <Switch
            value={darkMode}
            onValueChange={onDarkModeChange}
            trackColor={{ false: '#D5D1C9', true: '#899783' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, darkMode && styles.textDark]}>
        About RageSpace
      </Text>

      <View style={[styles.settingsCard, darkMode && styles.cardDark]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.settingTitle, darkMode && styles.textDark]}>
            Application
          </Text>

          <Text style={styles.aboutValue}>RageSpace</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.aboutRow}>
          <Text style={[styles.settingTitle, darkMode && styles.textDark]}>
            Version
          </Text>

          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>

        <View style={styles.separator} />

        <Text style={[styles.privacyTitle, darkMode && styles.textDark]}>
          Privacy & your data
        </Text>

        <Text
          style={[
            styles.privacyDescription,
            darkMode && styles.mutedDark,
          ]}
        >
          Your profile, journal entries and mood check-ins are stored
          locally on this device. RageSpace does not currently use
          an online account system.
        </Text>
      </View>

      <Text style={styles.footer}>
        RAGESPACE · YOUR SPACE. YOUR FEELINGS.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3ED',
  },

  containerDark: {
    backgroundColor: '#202320',
  },

  cardDark: {
    backgroundColor: '#303530',
    borderColor: '#454B45',
  },

  textDark: {
    color: '#F5F1E9',
  },

  mutedDark: {
    color: '#B8B9B1',
  },

  inputDark: {
    backgroundColor: '#252A26',
    borderColor: '#4A514A',
    color: '#F5F1E9',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 45,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F3ED',
  },

  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.98 }],
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 22,
  },

  backText: {
    color: '#B94128',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },

  eyebrow: {
    color: '#E45B3C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },

  heading: {
    color: '#292B29',
    fontSize: 32,
    fontWeight: '800',
  },

  description: {
    color: '#77756F',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 24,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 28,
  },

  photoContainer: {
    position: 'relative',
    marginBottom: 13,
  },

  photo: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },

  placeholderPhoto: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#E7DED1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  initials: {
    fontSize: 36,
    fontWeight: '800',
    color: '#292B29',
  },

  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#E45B3C',
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  cameraText: {
    fontSize: 14,
  },

  profileName: {
    color: '#292B29',
    fontSize: 20,
    fontWeight: '800',
  },

  profileEmail: {
    color: '#89877F',
    fontSize: 12,
    marginTop: 5,
  },

  changePhoto: {
    color: '#E45B3C',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#292B29',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 13,
    marginTop: 8,
  },

  editText: {
    color: '#E45B3C',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 28,
  },

  label: {
    color: '#B94128',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 12,
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#F6F3ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE7DF',
    padding: 13,
    color: '#292B29',
    fontSize: 13,
  },

  bioInput: {
    minHeight: 90,
  },

  characterCount: {
    textAlign: 'right',
    color: '#99958D',
    fontSize: 10,
    marginTop: 6,
  },

  saveButton: {
    backgroundColor: '#E45B3C',
    padding: 16,
    alignItems: 'center',
    borderRadius: 11,
    marginTop: 18,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  cancelButton: {
    alignItems: 'center',
    padding: 13,
    marginTop: 5,
  },

  cancelText: {
    color: '#77756F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 17,
    paddingVertical: 5,
    marginBottom: 26,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 17,
  },

  settingText: {
    flex: 1,
    paddingRight: 12,
  },

  settingTitle: {
    color: '#292B29',
    fontSize: 13,
    fontWeight: '800',
  },

  settingDescription: {
    color: '#89877F',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  separator: {
    height: 1,
    backgroundColor: '#EBE7DF',
  },

  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },

  aboutValue: {
    color: '#89877F',
    fontSize: 12,
  },

  privacyTitle: {
    color: '#292B29',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 17,
  },

  privacyDescription: {
    color: '#77756F',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 17,
  },

  footer: {
    textAlign: 'center',
    color: '#99958D',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 12,
  },
});