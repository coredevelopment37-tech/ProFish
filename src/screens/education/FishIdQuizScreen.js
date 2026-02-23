/**
 * FishIdQuizScreen — Gamified species identification quiz
 * #529 — Learn to identify species, earn badges
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { ScreenHeader, Button } from '../../components/Common';

// Quiz questions — species identification by description/characteristics
const QUIZ_POOL = [
  {
    question:
      'This freshwater fish has a large mouth that extends past the eye, greenish coloring, and a dark lateral stripe.',
    options: [
      'Smallmouth Bass',
      'Largemouth Bass',
      'Spotted Bass',
      'Green Sunfish',
    ],
    correct: 1,
    species: 'largemouth_bass',
    fact: 'Largemouth bass can eat prey up to 50% of their own body length!',
  },
  {
    question:
      'Known for its pink lateral stripe and spotted tail, this fish is native to Pacific coast streams.',
    options: ['Brown Trout', 'Brook Trout', 'Rainbow Trout', 'Cutthroat Trout'],
    correct: 2,
    species: 'rainbow_trout',
    fact: 'Rainbow trout that migrate to the ocean are called steelhead.',
  },
  {
    question:
      'This golden-flanked predator has sharp canine teeth, a forked tail, and glass-like eyes for low-light vision.',
    options: ['Yellow Perch', 'Sauger', 'Walleye', 'Zander'],
    correct: 2,
    species: 'walleye',
    fact: 'Walleye eyes have a reflective layer (tapetum lucidum) that helps them see in murky water.',
  },
  {
    question:
      'This saltwater fish has a distinctive black spot at the tail base and copper/bronze coloring.',
    options: [
      'Redfish (Red Drum)',
      'Black Drum',
      'Spotted Seatrout',
      'Sheepshead',
    ],
    correct: 0,
    species: 'redfish',
    fact: 'The tail spot is thought to confuse predators into attacking the tail instead of the head.',
  },
  {
    question:
      'The fastest fish in the ocean, with a sail-like dorsal fin and a bill.',
    options: ['Swordfish', 'Blue Marlin', 'Sailfish', 'Wahoo'],
    correct: 2,
    species: 'sailfish',
    fact: 'Sailfish can reach speeds up to 68 mph (110 km/h)!',
  },
  {
    question:
      'This whisker-faced bottom feeder is the largest catfish species in North America.',
    options: [
      'Channel Catfish',
      'Flathead Catfish',
      'Blue Catfish',
      'Yellow Bullhead',
    ],
    correct: 2,
    species: 'blue_catfish',
    fact: 'The world record blue catfish weighed 143 pounds, caught in Virginia.',
  },
  {
    question:
      'A prehistoric-looking freshwater fish with hard, diamond-shaped scales and a long snout. Can grow over 8 feet.',
    options: ['Longnose Gar', 'Bowfin', 'Paddlefish', 'Alligator Gar'],
    correct: 3,
    species: 'alligator_gar',
    fact: 'Alligator gar have existed for 100 million years — older than dinosaurs!',
  },
  {
    question:
      'This European predator looks like a pike but has vertical stripes and large eyes. Popular in Central Europe.',
    options: ['European Perch', 'Asp', 'Zander', 'Wels Catfish'],
    correct: 2,
    species: 'zander',
    fact: 'Zander are also called pike-perch and can grow over 20 pounds.',
  },
  {
    question:
      'Bright green sides, blue gill covers, and a red-orange breast. One of the most common panfish.',
    options: ['Bluegill', 'Pumpkinseed', 'Green Sunfish', 'Rock Bass'],
    correct: 0,
    species: 'bluegill',
    fact: 'Bluegill males build and guard nests, fanning eggs with their tails.',
  },
  {
    question:
      'This massive flatfish can weigh over 600 pounds and lives in deep, cold ocean water.',
    options: ['Flounder', 'Turbot', 'Atlantic Halibut', 'Sole'],
    correct: 2,
    species: 'atlantic_halibut',
    fact: 'Atlantic halibut are born with eyes on both sides — one eye migrates as they grow!',
  },
  {
    question:
      'Known as the "silver king," this large saltwater fish makes spectacular leaps when hooked.',
    options: ['Bonefish', 'Permit', 'Tarpon', 'Snook'],
    correct: 2,
    species: 'tarpon',
    fact: 'Tarpon can gulp air using a swim bladder, letting them survive in low-oxygen water.',
  },
  {
    question:
      'This North American predator has dark chain-like markings on its sides and a forked tail.',
    options: ['Northern Pike', 'Chain Pickerel', 'Muskie', 'Tiger Muskie'],
    correct: 1,
    species: 'chain_pickerel',
    fact: 'Chain pickerel get their name from the chain-link pattern on their green sides.',
  },
  {
    question:
      'The largest freshwater fish in Europe, this catfish can exceed 8 feet and 300 pounds.',
    options: ['Wels Catfish', 'Blue Catfish', 'Barbel', 'Huchen'],
    correct: 0,
    species: 'wels_catfish',
    fact: 'Wels catfish in the River Ebro have been recorded grabbing pigeons from the riverbank!',
  },
  {
    question:
      'Called "vampire fish" for its two large fangs, found in South American rivers.',
    options: ['Arapaima', 'Golden Dorado', 'Payara', 'Tambaqui'],
    correct: 2,
    species: 'payara',
    fact: "Payara's lower fangs can be up to 6 inches long and fit into holes in the upper jaw.",
  },
  {
    question:
      "Australia's most iconic freshwater gamefish, with a large mouth and bronzy-silver scales.",
    options: ['Mulloway', 'Murray Cod', 'Barramundi', 'Saratoga'],
    correct: 2,
    species: 'barramundi',
    fact: 'All barramundi start life as males and can change to females after a few years!',
  },
];

const BADGES = [
  { threshold: 5, name: 'Fish Spotter', icon: 'search' },
  { threshold: 15, name: 'ID Expert', icon: 'graduationCap' },
  { threshold: 30, name: 'Species Scholar', icon: 'bookOpen' },
  { threshold: 50, name: 'Ichthyologist', icon: 'dna' },
  { threshold: 100, name: 'Master Identifier', icon: 'crown' },
];

export default function FishIdQuizScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [shuffledQuestions] = useState(() =>
    [...QUIZ_POOL].sort(() => Math.random() - 0.5).slice(0, 10),
  );
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentQ = shuffledQuestions[questionIndex];

  const handleAnswer = useCallback(
    idx => {
      if (showResult) return;
      setSelected(idx);
      setShowResult(true);

      if (idx === currentQ.correct) {
        setScore(s => s + 1);
        setStreak(s => {
          const newStreak = s + 1;
          setBestStreak(bs => Math.max(bs, newStreak));
          return newStreak;
        });
      } else {
        setStreak(0);
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [showResult, currentQ, shakeAnim],
  );

  const handleNext = useCallback(async () => {
    if (questionIndex < shuffledQuestions.length - 1) {
      setQuestionIndex(i => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      // Save total correct answers
      try {
        const prev = parseInt(
          (await AsyncStorage.getItem('@profish_quiz_total')) || '0',
          10,
        );
        await AsyncStorage.setItem('@profish_quiz_total', String(prev + score));
      } catch (e) {
        /* ignore */
      }
    }
  }, [questionIndex, shuffledQuestions, score]);

  if (quizComplete) {
    const pct = Math.round((score / shuffledQuestions.length) * 100);
    const badge = BADGES.find(b => score >= b.threshold) || null;
    return (
      <View style={styles.container}>
        <View style={styles.resultScreen}>
          <View style={styles.resultEmoji}>
            {pct >= 80 ? (
              <AppIcon name="trophy" size={56} color="#FFD700" />
            ) : pct >= 50 ? (
              <AppIcon name="thumbsUp" size={56} color="#00D4AA" />
            ) : (
              <AppIcon name="bookOpen" size={56} color="#8899aa" />
            )}
          </View>
          <Text style={styles.resultTitle}>
            {pct >= 80
              ? 'Excellent!'
              : pct >= 50
              ? 'Good Job!'
              : 'Keep Practicing!'}
          </Text>
          <Text style={styles.resultScore}>
            {score} / {shuffledQuestions.length} correct ({pct}%)
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.resultStreak}>Best streak: {bestStreak}</Text>
            <AppIcon name="flame" size={16} color="#FF6633" />
          </View>
          {badge && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}>
              <Text style={styles.resultBadge}>Badge earned:</Text>
              <AppIcon name={badge.icon} size={18} color="#00D4AA" />
              <Text style={styles.resultBadge}>{badge.name}</Text>
            </View>
          )}
          <Button
            title="Done"
            onPress={() => navigation.goBack()}
            variant="primary"
            size="md"
            fullWidth={false}
            style={{ borderRadius: 24, paddingHorizontal: 48 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Fish ID Quiz" onBack={() => navigation.goBack()} />
      {/* Score + Progress */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginBottom: 8 }}>
          <Text style={styles.scoreText}>
            Score: {score} | Streak: {streak}
          </Text>
          <AppIcon name="flame" size={14} color="#FF6633" />
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  ((questionIndex + 1) / shuffledQuestions.length) * 100
                }%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Question */}
      <Animated.View
        style={[
          styles.questionCard,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <Text style={styles.questionNumber}>
          Question {questionIndex + 1} of {shuffledQuestions.length}
        </Text>
        <Text style={styles.questionText}>{currentQ.question}</Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQ.options.map((opt, i) => {
          let optStyle = styles.option;
          if (showResult && i === currentQ.correct)
            optStyle = [styles.option, styles.optionCorrect];
          else if (showResult && i === selected && i !== currentQ.correct)
            optStyle = [styles.option, styles.optionWrong];
          else if (selected === i)
            optStyle = [styles.option, styles.optionSelected];

          return (
            <TouchableOpacity
              key={i}
              style={optStyle}
              onPress={() => handleAnswer(i)}
              disabled={showResult}
            >
              <Text style={styles.optionLetter}>
                {String.fromCharCode(65 + i)}
              </Text>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fact + Next */}
      {showResult && (
        <View style={styles.factContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppIcon name="lightbulb" size={14} color="#FFD700" />
            <Text style={styles.factText}>{currentQ.fact}</Text>
          </View>
          <Button
            title={questionIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'See Results'}
            onPress={handleNext}
            variant="primary"
            size="md"
            style={{ borderRadius: 24 }}
          />
        </View>
      )}
    </View>
  );
}

export { QUIZ_POOL, BADGES };

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scoreText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 12,
  },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  questionCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionNumber: { fontSize: 12, color: colors.textTertiary, marginBottom: 8 },
  questionText: { fontSize: 17, color: colors.text, lineHeight: 24 },
  optionsContainer: { paddingHorizontal: 16, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary },
  optionCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.success + '15',
  },
  optionWrong: {
    borderColor: colors.error,
    backgroundColor: colors.error + '15',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textTertiary,
    marginRight: 12,
    width: 24,
  },
  optionText: { fontSize: 15, color: colors.text, flex: 1 },
  factContainer: { padding: 16, marginTop: 8 },
  factText: {
    fontSize: 14,
    color: colors.accent,
    lineHeight: 20,
    marginBottom: 16,
  },
  resultScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  resultEmoji: { marginBottom: 16, alignItems: 'center' },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  resultScore: { fontSize: 18, color: colors.textTertiary, marginBottom: 8 },
  resultStreak: { fontSize: 16, color: colors.accent, marginBottom: 16 },
  resultBadge: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 24,
  },
});
