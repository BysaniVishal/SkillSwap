// Seeds ~20 realistic student profiles across Indian colleges for demo purposes.
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
  {
    name: "Ananya Iyer",
    email: "ananya@skillswap.demo",
    college: "IIT Bombay",
    bio: "Backend-leaning CS junior building side projects with databases.",
    skillsToTeach: [
      { skill: "Java", category: "Programming", proficiency: "Advanced" },
      { skill: "SQL", category: "Programming", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Illustrator", category: "Design", proficiency: "Beginner", goal: "Design posters for the tech fest" },
      { skill: "Piano", category: "Music", proficiency: "Beginner" },
    ],
    availability: [{ day: "Sunday", start: "10:00", end: "12:00" }],
    learningPreference: "online",
    rating: { average: 4.6, count: 9 },
    completedSwaps: 9,
  },
  {
    name: "Rohan Mehta",
    email: "rohan@skillswap.demo",
    college: "IIT Delhi",
    bio: "Physics major with a growing interest in data analysis.",
    skillsToTeach: [
      { skill: "Physics", category: "Academics", proficiency: "Advanced" },
      { skill: "Statistics", category: "Academics", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "French", category: "Languages", proficiency: "Beginner", goal: "Plan to study abroad" },
      { skill: "Cricket", category: "Sports", proficiency: "Beginner" },
    ],
    availability: [{ day: "Saturday", start: "14:00", end: "16:00" }],
    learningPreference: "both",
    rating: { average: 4.8, count: 14 },
    completedSwaps: 14,
  },
  {
    name: "Fatima Sheikh",
    email: "fatima@skillswap.demo",
    college: "VIT Vellore",
    bio: "Data-curious CS student, new to the platform.",
    skillsToTeach: [
      { skill: "SQL", category: "Programming", proficiency: "Advanced" },
      { skill: "Statistics", category: "Academics", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "Piano", category: "Music", proficiency: "Beginner" },
      { skill: "Illustrator", category: "Design", proficiency: "Intermediate" },
    ],
    availability: [{ day: "Wednesday", start: "18:00", end: "20:00" }],
    learningPreference: "online",
    rating: { average: 0, count: 0 },
    completedSwaps: 0,
  },
  {
    name: "Aditya Kulkarni",
    email: "aditya@skillswap.demo",
    college: "BITS Pilani",
    bio: "Cricket team all-rounder studying computer science.",
    skillsToTeach: [
      { skill: "Cricket", category: "Sports", proficiency: "Advanced" },
      { skill: "Java", category: "Programming", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "German", category: "Languages", proficiency: "Beginner", goal: "Considering higher studies in Germany" },
      { skill: "Statistics", category: "Academics", proficiency: "Beginner" },
    ],
    availability: [{ day: "Sunday", start: "16:00", end: "18:00" }],
    learningPreference: "both",
    rating: { average: 4.5, count: 6 },
    completedSwaps: 6,
  },
  {
    name: "Divya Nair",
    email: "divya@skillswap.demo",
    college: "Manipal Institute of Technology",
    bio: "Classically trained pianist, fluent in Hindi and English.",
    skillsToTeach: [
      { skill: "Piano", category: "Music", proficiency: "Advanced" },
      { skill: "Hindi", category: "Languages", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "SQL", category: "Programming", proficiency: "Beginner" },
      { skill: "Social Media Marketing", category: "Marketing", proficiency: "Intermediate" },
    ],
    availability: [{ day: "Saturday", start: "09:00", end: "11:00" }],
    learningPreference: "offline",
    rating: { average: 4.7, count: 10 },
    completedSwaps: 10,
  },
  {
    name: "Aakash Reddy",
    email: "aakash@skillswap.demo",
    college: "RV College of Engineering",
    bio: "Freelance graphic designer building a personal brand online.",
    skillsToTeach: [
      { skill: "Illustrator", category: "Design", proficiency: "Advanced" },
      { skill: "Social Media Marketing", category: "Marketing", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "Java", category: "Programming", proficiency: "Beginner", goal: "Switch into backend development" },
      { skill: "Cricket", category: "Sports", proficiency: "Intermediate" },
    ],
    availability: [{ day: "Friday", start: "17:00", end: "19:00" }],
    learningPreference: "both",
    rating: { average: 4.3, count: 5 },
    completedSwaps: 5,
  },
  {
    name: "Ishita Banerjee",
    email: "ishita@skillswap.demo",
    college: "Jadavpur University",
    bio: "Statistics major, new here and eager to swap skills.",
    skillsToTeach: [
      { skill: "Statistics", category: "Academics", proficiency: "Advanced" },
      { skill: "Physics", category: "Academics", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Tamil", category: "Languages", proficiency: "Beginner" },
      { skill: "Piano", category: "Music", proficiency: "Intermediate" },
    ],
    availability: [{ day: "Sunday", start: "15:00", end: "17:00" }],
    learningPreference: "online",
    rating: { average: 0, count: 0 },
    completedSwaps: 0,
  },
  {
    name: "Sameer Joshi",
    email: "sameer@skillswap.demo",
    college: "Symbiosis Institute of Technology",
    bio: "Runs a small marketing blog, learning to back it up with data.",
    skillsToTeach: [
      { skill: "Social Media Marketing", category: "Marketing", proficiency: "Advanced" },
      { skill: "Content Writing", category: "Marketing", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Statistics", category: "Academics", proficiency: "Beginner" },
      { skill: "SQL", category: "Programming", proficiency: "Beginner" },
    ],
    availability: [{ day: "Saturday", start: "11:00", end: "13:00" }],
    learningPreference: "both",
    rating: { average: 4.6, count: 8 },
    completedSwaps: 8,
  },
  {
    name: "Neha Choudhary",
    email: "neha@skillswap.demo",
    college: "Osmania University",
    bio: "Multilingual translator interested in picking up programming.",
    skillsToTeach: [
      { skill: "Hindi", category: "Languages", proficiency: "Advanced" },
      { skill: "French", category: "Languages", proficiency: "Intermediate" },
    ],
    skillsToLearn: [
      { skill: "Physics", category: "Academics", proficiency: "Beginner" },
      { skill: "Java", category: "Programming", proficiency: "Beginner" },
    ],
    availability: [{ day: "Thursday", start: "17:00", end: "19:00" }],
    learningPreference: "offline",
    rating: { average: 4.4, count: 7 },
    completedSwaps: 7,
  },
  {
    name: "Varun Kapoor",
    email: "varun@skillswap.demo",
    college: "Amity University",
    bio: "Cricket captain and German learner building a YouTube channel.",
    skillsToTeach: [
      { skill: "Cricket", category: "Sports", proficiency: "Advanced" },
      { skill: "German", category: "Languages", proficiency: "Advanced" },
    ],
    skillsToLearn: [
      { skill: "Illustrator", category: "Design", proficiency: "Beginner", goal: "Create branding for my YouTube channel" },
      { skill: "Social Media Marketing", category: "Marketing", proficiency: "Beginner" },
    ],
    availability: [{ day: "Sunday", start: "09:00", end: "11:00" }],
    learningPreference: "both",
    rating: { average: 4.9, count: 11 },
    completedSwaps: 11,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const password = await bcrypt.hash("password123", 10);

  // Upsert by email rather than delete-and-recreate. Deleting and
  // reinserting gives every reseeded student a brand new _id, which
  // silently orphans any real Swap/SwapRequest/Review/Session a real
  // account has already formed with them (populate() just returns null
  // for the dangling reference, which crashes any page that assumes a
  // populated user is always present). Upserting keeps each student's
  // _id stable across reseeds, so real relationships stay intact.
  for (const student of STUDENTS) {
    await User.findOneAndUpdate(
      { email: student.email },
      { $set: { ...student, password } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${STUDENTS.length} students. All passwords: password123`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
