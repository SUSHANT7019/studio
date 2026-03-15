# TechQuiz Ascent 🚀

TechQuiz Ascent is a precision technical competition platform built with **Next.js 15**, **Supabase**, and **ShadCN UI**. It features a multi-level challenge system where participants must be promoted by administrators to advance through increasingly difficult rounds.

## ✨ Features

### 👨‍🎓 Participant Experience
- **Multi-Level Challenges**: Basic (Open), Intermediate (Invite), and Hard (Championship).
- **Eligibility Engine**: Smart check to ensure participants only enter levels they are qualified for.
- **Dynamic Quiz Engine**:
  - True random question shuffling (Fisher-Yates).
  - Real-time countdown timer with auto-submission.
  - **Question Navigator**: Interactive sidebar to track attempted vs. unattempted items.
  - Persistent state: Progress is saved locally in case of accidental refresh.

### 🛡️ Admin Portal
- **Secure Authentication**: Protected dashboard via Supabase Auth.
- **Unified Overview**: Real-time stats on submissions and promotions.
- **Question Bank Management**:
  - Full CRUD operations for technical questions.
  - Difficulty level assignment.
  - **CSV Export**: Download the entire question bank for offline review.
- **Participant Management**:
  - **Promotion Workflow**: Review scores and promote high-performers to higher levels.
  - **Advanced Filtering**: Search by name/college and filter by score using mathematical symbols (≥, ≤, =).
  - **CSV Results Export**: Download detailed performance reports.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI + Lucide Icons
- **AI Integration**: Genkit (Pre-configured)

## 🚀 Getting Started

### 1. Supabase Configuration
Create the following tables in your Supabase SQL Editor:

```sql
-- Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  difficulty_level TEXT NOT NULL, -- 'Basic', 'Intermediate', 'Hard'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants Table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  level TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 15,
  time_taken INTEGER, -- in seconds
  qualified_for TEXT, -- 'Intermediate' or 'Hard'
  submission_time TIMESTAMPTZ DEFAULT NOW(),
  quiz_date DATE DEFAULT CURRENT_DATE
);
```

### 2. Environment Variables
Add these to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Admin Access
1. Go to **Supabase Authentication** -> **Users**.
2. Add a new user (e.g., `admin@example.com`).
3. Log in via the `/admin` route on the web application.

## 📁 Project Structure
- `src/app/` - Next.js App Router pages (Home, Quiz, Admin).
- `src/components/` - Reusable ShadCN and custom UI components.
- `src/lib/` - Utility functions and Supabase client initialization.
- `src/hooks/` - Custom React hooks for state and UI.

## 📜 License
© 2024 TechQuiz Ascent. All rights reserved.