// Seeds ~10 realistic student profiles for demo purposes.
// Safe to re-run: only touches the specific seed accounts below, never wipes the whole DB.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const STUDENTS = [
  {
    name: "Rahul Kumar",
    email: "rahul@skillswap.demo",
    college: "SSN College of Engineering",
    bio: "CS sophomore who loves systems programming and clean code.",
    skillsToTeach: [
      { skill: "C++", category: "Programming", proficiency: "Advanced" },
      { skill: "Data Structures", category: "Programming", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "UI/UX", category: "Design", proficiency: "Beginner", goal: "Design my own app" },
      { skill: "Public Speaking", category: "Academics", proficiency: "Beginner" },
    ],
    availability: [{ day: "Saturday", start: "10:00", end: "14:00" }],
    learningPreference: "both",
    rating: { average: 4.8, count: 12 },
    completedSwaps: 12,
  },
  {
    name: "Priya Menon",
    email: "priya@skillswap.demo",
    college: "Loyola College",
    bio: "Design student who's slowly falling in love with frontend code.",
    skillsToTeach: [
      { skill: "UI/UX", category: "Design", proficiency: "Advanced" },
      { skill: "Figma", category: "Design", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "C++", category: "Programming", proficiency: "Beginner", goal: "Understand OOP basics" },
      { skill: "Python", category: "Programming", proficiency: "Intermediate" },
    ],
    availability: [
      { day: "Saturday", start: "11:00", end: "13:00" },
      { day: "Sunday", start: "15:00", end: "17:00" },
    ],
    learningPreference: "both",
    rating: { average: 4.6, count: 8 },
    completedSwaps: 8,
  },
  {
    name: "Arjun Nair",
    email: "arjun@skillswap.demo",
    college: "Anna University",
    bio: "Self-taught guitarist, backend developer by day.",
    skillsToTeach: [
      { skill: "Guitar", category: "Music", proficiency: "Advanced" },
      { skill: "Python", category: "Programming", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Spanish", category: "Languages", proficiency: "Beginner" },
      { skill: "Chess", category: "Sports", proficiency: "Intermediate" },
    ],
    availability: [
      { day: "Tuesday", start: "18:00", end: "20:00" },
      { day: "Saturday", start: "16:00", end: "18:00" },
    ],
    learningPreference: "offline",
    rating: { average: 0, count: 0 },
    completedSwaps: 0,
  },
  {
    name: "Zoya Sheikh",
    email: "zoya@skillswap.demo",
    college: "Christ University",
    bio: "Photographer trying to break into digital marketing.",
    skillsToTeach: [
      { skill: "Photography", category: "Other", proficiency: "Advanced" },
      { skill: "Excel", category: "Marketing", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Cooking", category: "Other", proficiency: "Beginner" },
      { skill: "Content Writing", category: "Marketing", proficiency: "Beginner" },
    ],
    availability: [{ day: "Monday", start: "18:00", end: "20:00" }],
    learningPreference: "online",
    rating: { average: 4.2, count: 5 },
    completedSwaps: 5,
  },
  {
    name: "Kabir Singh",
    email: "kabir@skillswap.demo",
    college: "Delhi University",
    bio: "Math tutor and campus chess club president.",
    skillsToTeach: [
      { skill: "Chess", category: "Sports", proficiency: "Advanced" },
      { skill: "Calculus", category: "Academics", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "Guitar", category: "Music", proficiency: "Beginner", goal: "Play at the college fest" },
    ],
    availability: [
      { day: "Wednesday", start: "17:00", end: "19:00" },
      { day: "Saturday", start: "10:00", end: "12:00" },
    ],
    learningPreference: "both",
    rating: { average: 4.9, count: 20 },
    completedSwaps: 15,
  },
  {
    name: "Meera Iyer",
    email: "meera@skillswap.demo",
    college: "Stella Maris College",
    bio: "Bilingual content writer exploring web development.",
    skillsToTeach: [
      { skill: "Spanish", category: "Languages", proficiency: "Advanced" },
      { skill: "Content Writing", category: "Marketing", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Photography", category: "Other", proficiency: "Beginner" },
      { skill: "React", category: "Programming", proficiency: "Beginner", goal: "Build a personal blog" },
    ],
    availability: [{ day: "Thursday", start: "18:00", end: "20:00" }],
    learningPreference: "online",
    rating: { average: 4.5, count: 6 },
    completedSwaps: 6,
  },
  {
    name: "Vishal Sharma",
    email: "vishal@skillswap.demo",
    college: "VIT Chennai",
    bio: "Frontend dev who wants to design as well as he codes.",
    skillsToTeach: [
      { skill: "React", category: "Programming", proficiency: "Intermediate" },
      { skill: "JavaScript", category: "Programming", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "UI/UX", category: "Design", proficiency: "Intermediate", goal: "Improve my portfolio site design" },
      { skill: "Badminton", category: "Sports", proficiency: "Beginner" },
    ],
    availability: [
      { day: "Saturday", start: "10:00", end: "14:00" },
      { day: "Sunday", start: "10:00", end: "12:00" },
    ],
    learningPreference: "both",
    rating: { average: 4.7, count: 9 },
    completedSwaps: 9,
  },
  {
    name: "Anjali Verma",
    email: "anjali@skillswap.demo",
    college: "Ethiraj College",
    bio: "Debate team captain who writes for the college magazine.",
    skillsToTeach: [
      { skill: "Public Speaking", category: "Academics", proficiency: "Advanced" },
      { skill: "Content Writing", category: "Marketing", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "Excel", category: "Marketing", proficiency: "Beginner" },
      { skill: "Data Structures", category: "Programming", proficiency: "Beginner" },
    ],
    availability: [{ day: "Friday", start: "16:00", end: "18:00" }],
    learningPreference: "offline",
    rating: { average: 4.3, count: 4 },
    completedSwaps: 4,
  },
  {
    name: "Karthik Raja",
    email: "karthik@skillswap.demo",
    college: "PSG College of Technology",
    bio: "Badminton state-level player, chemistry major.",
    skillsToTeach: [
      { skill: "Badminton", category: "Sports", proficiency: "Advanced" },
      { skill: "Chemistry", category: "Academics", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Guitar", category: "Music", proficiency: "Beginner" },
      { skill: "Calculus", category: "Academics", proficiency: "Intermediate" },
    ],
    availability: [
      { day: "Saturday", start: "08:00", end: "10:00" },
      { day: "Sunday", start: "08:00", end: "10:00" },
    ],
    learningPreference: "offline",
    rating: { average: 0, count: 0 },
    completedSwaps: 0,
  },
  {
    name: "Sneha Reddy",
    email: "sneha@skillswap.demo",
    college: "Women's Christian College",
    bio: "Home cook and chemistry nerd, aspiring food blogger.",
    skillsToTeach: [
      { skill: "Cooking", category: "Other", proficiency: "Advanced" },
      { skill: "Chemistry", category: "Academics", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "Photography", category: "Other", proficiency: "Intermediate", goal: "Start a food blog" },
      { skill: "Spanish", category: "Languages", proficiency: "Beginner" },
    ],
    availability: [{ day: "Sunday", start: "11:00", end: "13:00" }],
    learningPreference: "both",
    rating: { average: 4.4, count: 7 },
    completedSwaps: 7,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const password = await bcrypt.hash("password123", 10);
  const emails = STUDENTS.map((s) => s.email);
  await User.deleteMany({ email: { $in: emails } });

  await User.insertMany(STUDENTS.map((s) => ({ ...s, password })));

  console.log(`Seeded ${STUDENTS.length} students. All passwords: password123`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
