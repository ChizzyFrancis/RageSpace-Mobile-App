import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

type Props = {
  onBack: () => void;
  darkMode: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'companion';
};

const suggestions = [
  'I feel stressed',
  'I had a bad day',
  'I need some encouragement',
];

const getReply = (message: string): string => {
  const text = message.toLowerCase();

  if (
    text.includes('suicid') ||
    text.includes('kill myself') ||
    text.includes('end my life') ||
    text.includes('hurt myself')
  ) {
    return "I'm really sorry things feel this difficult. You deserve immediate support. If you're in immediate danger, call 999 or go to A&E. You can also call Samaritans free on 116 123, any time. Please consider reaching out to someone you trust too.";
  }

  if (
    text.includes('stress') ||
    text.includes('overwhelm') ||
    text.includes('pressure')
  ) {
    return "That sounds like a lot to carry. Let's take things one step at a time. You don't have to solve everything right now. What's the biggest thing weighing on your mind?";
  }

  if (
    text.includes('angry') ||
    text.includes('mad') ||
    text.includes('frustrat')
  ) {
    return "It's okay to acknowledge that you're angry. You don't have to pretend everything is fine. Would it help to talk about what happened, or would you prefer a moment to calm down?";
  }

  if (
    text.includes('sad') ||
    text.includes('cry') ||
    text.includes('lonely') ||
    text.includes('down')
  ) {
    return "I'm sorry you're feeling this way. Your feelings matter, and you don't need to hide them here. Do you want to tell me what's been happening?";
  }

  if (
    text.includes('bad day') ||
    text.includes('terrible day')
  ) {
    return "I'm sorry today hasn't been kind to you. Remember, one difficult day doesn't define your whole journey. What happened today?";
  }

  if (
    text.includes('encouragement') ||
    text.includes('motivat') ||
    text.includes('give up')
  ) {
    return "You've made it through difficult moments before, even when you weren't sure you could. Give yourself credit for still trying. Small steps count too. ❤️";
  }

  if (
    text.includes('happy') ||
    text.includes('excited') ||
    text.includes('good')
  ) {
    return "That's lovely to hear! ❤️ It's worth taking a moment to appreciate the good things too. What's making you feel this way?";
  }

  if (text.includes('thank')) {
    return "You're very welcome. Remember to be kind to yourself. You deserve that kindness too. ❤️";
  }

  if (
    text.includes('tired') ||
    text.includes('exhaust')
  ) {
    return "It sounds like you could use a little rest. You don't have to be productive every moment. Have you had a chance to pause and recharge?";
  }

  return "Thank you for sharing that with me. I'm here to give you a space to express yourself without judgement. Would you like to tell me a little more about how that makes you feel?";
};

export default function CompanionScreen({
  onBack,
  darkMode,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text:
        "Hey, I'm glad you're here. ❤️\n\n" +
        "This is your space to talk freely. You can share what's on your mind, " +
        "how you're feeling, or simply have a little conversation.\n\n" +
        "What's going on with you today?",
      sender: 'companion',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (replyTimer.current) {
        clearTimeout(replyTimer.current);
      }
    };
  }, []);

  const getCompanionReply = (message: string): string => {
    return getReply(message);
  };

  const sendMessage = (suggestion?: string) => {
    const text = (suggestion ?? inputText).trim();

    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      text,
      sender: 'user',
    };

    setMessages((previous) => [...previous, userMessage]);
    setInputText('');
    setIsTyping(true);

    replyTimer.current = setTimeout(() => {
      const reply: ChatMessage = {
        id: `${Date.now()}-companion`,
        text: getCompanionReply(text),
        sender: 'companion',
      };

      setMessages((previous) => [...previous, reply]);
      setIsTyping(false);
      replyTimer.current = null;
    }, 700);
  };

  const resetConversation = () => {
    if (replyTimer.current) {
      clearTimeout(replyTimer.current);
      replyTimer.current = null;
    }

    setIsTyping(false);
    setInputText('');

    setMessages([
      {
        id: 'welcome',
        text:
          "Hey, welcome back. ❤️\n\n" +
          "This is your space to talk freely. What's on your mind today?",
        sender: 'companion',
      },
    ]);
  };

  const theme = darkMode
    ? {
        background: '#202320',
        surface: '#292D29',
        card: '#303530',
        input: '#303530',
        border: '#414740',
        text: '#F5F1E9',
        secondary: '#B5B6AC',
        muted: '#92978D',
        soft: '#383E37',
        bubble: '#303630',
      }
    : {
        background: '#F6F3ED',
        surface: '#FFFFFF',
        card: '#F0ECE4',
        input: '#FFFFFF',
        border: '#E9E3D9',
        text: '#292B29',
        secondary: '#77756F',
        muted: '#99958D',
        soft: '#E7DED1',
        bubble: '#FFFFFF',
      };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* HEADER */}

        <View
          style={[
            styles.header,
            { borderBottomColor: theme.border },
          ]}
        >
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backText}>← BACK</Text>
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.text },
              ]}
            >
              YOUR COMPANION
            </Text>

            <Text style={styles.onlineText}>
              HERE TO LISTEN
            </Text>
          </View>

          <Pressable
            onPress={resetConversation}
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.resetText,
                { color: theme.muted },
              ]}
            >
              RESET
            </Text>
          </Pressable>
        </View>

        {/* INTRODUCTION */}

        <View
          style={[
            styles.intro,
            { backgroundColor: theme.card },
          ]}
        >
          <View
            style={[
              styles.companionIcon,
              { backgroundColor: theme.soft },
            ]}
          >
            <Text style={styles.companionEmoji}>✨</Text>
          </View>

          <View style={styles.introText}>
            <Text
              style={[
                styles.title,
                { color: theme.text },
              ]}
            >
              A space to talk.
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: theme.secondary },
              ]}
            >
              Your thoughts matter. Take your time.
            </Text>
          </View>
        </View>

        {/* CHAT MESSAGES */}

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({
              animated: true,
            });
          }}
        >
          <Text
            style={[
              styles.dateLabel,
              { color: theme.muted },
            ]}
          >
            TODAY
          </Text>

          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.sender === 'user'
                  ? styles.userMessageRow
                  : styles.companionMessageRow,
              ]}
            >
              {message.sender === 'companion' && (
                <View
                  style={[
                    styles.smallAvatar,
                    { backgroundColor: theme.soft },
                  ]}
                >
                  <Text style={styles.smallAvatarText}>
                    ✦
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  message.sender === 'user'
                    ? styles.userBubble
                    : [
                        styles.companionBubble,
                        { backgroundColor: theme.bubble },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.sender === 'user'
                      ? styles.userMessageText
                      : {
                          color: theme.text,
                        },
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={styles.typingRow}>
              <View
                style={[
                  styles.smallAvatar,
                  { backgroundColor: theme.soft },
                ]}
              >
                <Text style={styles.smallAvatarText}>
                  ✦
                </Text>
              </View>

              <View
                style={[
                  styles.typingBubble,
                  { backgroundColor: theme.bubble },
                ]}
              >
                <Text
                  style={[
                    styles.typingText,
                    { color: theme.muted },
                  ]}
                >
                  Thinking...
                </Text>
              </View>
            </View>
          )}

          {messages.length === 1 && (
            <View style={styles.suggestions}>
              <Text
                style={[
                  styles.suggestionHeading,
                  { color: theme.muted },
                ]}
              >
                NOT SURE WHERE TO START?
              </Text>

              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={({ pressed }) => [
                    styles.suggestionButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => sendMessage(suggestion)}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: theme.text },
                    ]}
                  >
                    {suggestion} →
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* MESSAGE INPUT */}

        <View
          style={[
            styles.inputArea,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.input,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text },
              ]}
              placeholder="Share what's on your mind..."
              placeholderTextColor={theme.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isTyping}
            />

            <Pressable
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isTyping}
              style={({ pressed }) => [
                styles.sendButton,
                (!inputText.trim() || isTyping) &&
                  styles.sendButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sendButtonText}>
                ↑
              </Text>
            </Pressable>
          </View>

          <Text
            style={[
              styles.disclaimer,
              { color: theme.muted },
            ]}
          >
            A supportive chat prototype, not a replacement for
            professional mental health support.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardContainer: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },

  backText: {
    color: '#E45B3C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  headerTitleContainer: {
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  onlineText: {
    color: '#899783',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },

  resetText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 21,
    paddingVertical: 17,
  },

  companionIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  companionEmoji: {
    fontSize: 21,
  },

  introText: {
    flex: 1,
  },

  title: {
    fontSize: 19,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },

  chatArea: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 25,
  },

  dateLabel: {
    alignSelf: 'center',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 22,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },

  userMessageRow: {
    justifyContent: 'flex-end',
  },

  companionMessageRow: {
    justifyContent: 'flex-start',
  },

  smallAvatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  smallAvatarText: {
    color: '#E45B3C',
    fontSize: 15,
    fontWeight: '900',
  },

  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 17,
  },

  companionBubble: {
    borderBottomLeftRadius: 4,
  },

  userBubble: {
    backgroundColor: '#E45B3C',
    borderBottomRightRadius: 4,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 21,
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  typingBubble: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
  },

  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  suggestions: {
    marginTop: 10,
    marginLeft: 37,
  },

  suggestionHeading: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 11,
  },

  suggestionButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 9,
  },

  suggestionText: {
    fontSize: 11,
    fontWeight: '700',
  },

  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 17,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 7,
    paddingVertical: 7,
  },

  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    fontSize: 13,
    paddingTop: 11,
    paddingBottom: 8,
  },

  sendButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#E45B3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  sendButtonDisabled: {
    backgroundColor: '#8D817B',
    opacity: 0.65,
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },

  disclaimer: {
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 9,
    paddingHorizontal: 8,
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});