# SCREEN_SPECS.md

Version 1.0

---

# Screen Philosophy

Every screen exists to answer one question.

Never two.

If a screen needs two primary actions,
it should probably be two screens.

Users should never wonder what to do next.

The next action should always be obvious.

---

# Navigation

Bottom Navigation

Home

Calendar

Train

Progress

More

Train is always the central highlighted action.

---

# HOME

## Goal

Answer immediately:

What is today's situation?

What should I do next?

The user should understand the entire screen in under three seconds.

---

## Hero Section

Always the first visible element.

Height approximately 220px.

Contains only ONE primary action.

Possible states:

• Start today's workout

• Continue workout

• Workout completed

• Rest day

Never show secondary metrics before the Hero.

---

## Hero Layout

```
┌─────────────────────────────┐

Good morning Higinio

Thursday · 30 July

──────────────────────────────

DAY A

Estimated time

52 min

[ START WORKOUT ]

└─────────────────────────────┘
```

Large typography.

Single CTA.

No distractions.

---

## Quick Metrics

Displayed below Hero.

Maximum four cards.

Preferred order:

Weight

Steps

Sleep

Blood Pressure

Each card answers only one question.

Example:

```
95.45

kg

↓

-0.45 this week
```

Never mix unrelated metrics.

---

## Weekly Activity

Horizontal component.

Show completed workouts.

```
M T W T F S S

○ ○ ● ○ ● ○ ○
```

Never use calendar style here.

---

## Quick Actions

Large touch cards.

Register Weight

Register Sleep

Register Blood Pressure

Register Steps

Register Measurements

Each action opens directly into the form.

No intermediate screen.

---

# CALENDAR

## Goal

The calendar is memory.

Not navigation.

Users should instantly understand:

What happened.

When.

Without opening each day.

---

## Month View

Simple month grid.

No clutter.

Each day can display:

Workout

Daily data

Selected

Today

Maximum two indicators per day.

---

Example

```
17

●

18

○

19

⬤
```

No six icons inside one square.

---

## Day Detail

Appears as Bottom Sheet.

Contains:

Weight

Blood Pressure

Steps

Sleep

Measurements

Workout

Each row shows:

Current value

or

Not registered

Tap opens editor.

---

# TRAIN

## Goal

The user should feel inside the workout.

Everything unrelated disappears.

Training Mode should feel like another application.

---

## Workout Start

Large Hero.

Workout name.

Estimated duration.

Exercise count.

Primary CTA

START

---

## Active Workout

Top

Workout progress

```
DAY A

3 / 7

26:31
```

---

Exercise Illustration

Largest visual element.

Around one third of screen.

---

Exercise Name

Very large.

Group

Smaller.

---

Target

3 sets

8–12 reps

RIR 1–2

---

Previous Session

```
50kg

11

10

9
```

Large.

Easy to compare.

---

Current Set

Huge inputs.

```
Weight

50.00

Reps

10
```

One obvious CTA.

COMPLETE SET

---

# REST TIMER

The timer deserves a dedicated screen.

Never a small popup.

```
01:28
```

Circular animated ring.

Below:

Next

Chest Supported Row

Set 2

Buttons:

Skip

+30 sec

Choose Exercise

Continue Current Exercise

---

# EXERCISE LIST

Scrollable list.

Shows:

Completed

Current

Pending

Skipped

Users can tap any exercise.

Changing order is always allowed.

The routine order is only a recommendation.

---

# WORKOUT SUMMARY

Large Success Card.

Workout Name

Duration

Exercises

Sets

Cardio

Skipped

Primary CTA

Finish

Secondary CTA

Edit Workout

---

# PROGRESS

Goal

Help users understand trends.

Not data.

---

Tabs

Weight

Measurements

Training

Sleep

Blood Pressure

Steps

---

Charts

One chart per screen.

Never stack multiple charts.

---

Weight

Daily points

7-day average

Target line

Minimal grid

---

Exercise Progress

One exercise.

Timeline.

Load.

Reps.

Personal best badge.

No comparison between different exercises.

---

# EXERCISES

Large list.

Illustration.

Name.

Muscle.

Tap opens details.

Search always visible.

---

Exercise Detail

Illustration.

Historical chart.

Workout history.

Edit.

Archive.

---

# ROUTINES

Card list.

DAY A

DAY B

DAY C

HOME

Large cards.

Each card shows:

Exercise count

Estimated duration

Last used

---

Routine Detail

Reorder exercises.

Edit parameters.

Alternatives.

Pairs.

Notes.

---

# EXPORT

Very simple.

Step 1

Select date range.

Step 2

Select modules.

Step 3

CSV

PDF

Large CTA.

Export.

---

# SETTINGS

Minimal.

Profile.

Theme.

Units.

Logout.

Nothing else.

---

# UNIVERSAL SCREEN RULES

Every screen must have:

One Hero.

One Primary Action.

Maximum one secondary action group.

Maximum one scroll direction.

No floating buttons unless absolutely necessary.

---

# TOUCH TARGETS

Minimum

48px

Preferred

56px

---

# SAFE AREA

Respect iPhone safe areas.

Bottom navigation should never collide with gesture area.

---

# KEYBOARD

The keyboard should never hide the active input.

Forms should automatically scroll.

---

# SHEETS

Prefer Bottom Sheets over new pages.

Use pages only when:

The task is long.

Or requires immersion.

---

# DIALOGS

Use dialogs only for:

Delete

Discard changes

Logout

Never for data entry.

---

# ANIMATIONS

Cards

Lift

Buttons

Compress

Charts

Draw

Counters

Animate

Pages

Fade + Slide

Bottom Sheets

Slide from bottom

Never use dramatic animations.

---

# SCREEN CHECKLIST

Before shipping any screen ask:

Can I understand it in three seconds?

Can I use it with one thumb?

Is there only one obvious action?

Can I remove something?

Does it feel premium?

Would I proudly show this screen in a keynote?

If not,

redesign it.