# **App Name**: TechQuiz Ascent

## Core Features:

- Participant Entry & Level Selection: A landing page for participants to input their name and college, and select their desired quiz difficulty level (Basic, Intermediate, Hard) before starting the quiz.
- Dynamic Quiz Generation: Fetches a unique set of 15 questions from the Supabase database for each participant, filtered by their selected difficulty level and randomized for variety.
- Interactive Quiz Interface: Displays questions with four options, tracks selected answers, includes a question progress indicator (e.g., 'Question 4 of 15'), and provides 'Next', 'Previous', and 'Submit' navigation.
- Real-time Quiz Timer: An always-visible timer tailored to the selected quiz level (10/8/5 minutes). It automatically submits the quiz when time expires and restores remaining time/answers upon page refresh.
- Quiz Scoring & Submission Handling: Automatically evaluates answers, calculates the participant's score, displays the final score, and stores all attempt details (score, time taken, answers) to Supabase, preventing duplicate entries for the same participant and level.
- Secure Admin Panel & Question Management: Provides a secure login for administrators to access a dashboard where they can add, edit, or delete quiz questions.
- Admin Results & Round Management: An admin dashboard to view and filter participant quiz attempt results (by level, score, submission time, round). Allows admins to create new competition rounds, assign participants to rounds, mark winners/runners-up, and export all results to Excel/CSV.

## Style Guidelines:

- The app uses a professional and clean light theme. The primary color, representing technology and precision, is a vibrant blue (#2680D9). The background color is a heavily desaturated, almost off-white shade of the primary hue (#F9FAFB), promoting clarity. An accent color in a contrasting cyan (#0AC2C2) is used for calls-to-action and highlights.
- Body and headline font: 'Inter' (sans-serif) for its modern, objective, and neutral aesthetic, ensuring excellent readability and a polished feel throughout the application.
- Utilize a set of clean, minimalist vector icons that provide clear visual cues for navigation, progress indicators, and administrative actions without overwhelming the user interface.
- Participant UI features a clean, card-based layout for questions, emphasizing the question and options. Important elements like the timer and progress bar are prominently displayed. Admin UI is designed as a structured dashboard with tables for data management, filters, and clearly defined action buttons for efficient task completion. Both layouts are optimized for desktop use.
- Implement subtle, swift animations for transitions between questions, updates to the timer, and submission confirmations to provide feedback and enhance the perceived responsiveness and modernity of the application.