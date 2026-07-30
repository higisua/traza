# COMPONENTS.md

Version: 1.0

---

# Philosophy

Components are the building blocks of TRAZA.

Every component exists to solve one specific problem.

Never create a new component if an existing one can solve the problem.

Prefer composition over duplication.

Every component should feel handcrafted.

Not generic.

Not "Tailwind".

Not "shadcn".

Every component should look like it belongs only to TRAZA.

---

# Component Categories

The design system contains six families.

• Layout

• Display

• Input

• Navigation

• Feedback

• Charts

Never create components outside these families unless absolutely necessary.

---

##########################################################
LAYOUT COMPONENTS
##########################################################

==========================================================
HeroCard
==========================================================

Purpose

The most important component in the product.

Every important screen begins with one HeroCard.

Only one HeroCard may exist per screen.

---

Used in

Dashboard

Workout Start

Workout Summary

Rest Day

Achievements

---

Structure

Title

Subtitle

Main Value

Supporting Information

Primary CTA

---

Layout

+----------------------------------+

Title

Subtitle

Large Value

Support

[ Primary Button ]

+----------------------------------+

---

Visual Rules

Large padding

Rounded corners

Large shadow

Plenty of whitespace

Never include charts

Never include tables

Never include secondary buttons

---

Animations

Fade

Scale

Count-up numbers

Button fade

---

==========================================================
PageHeader
==========================================================

Purpose

Introduces every screen.

---

Contains

Back Button

Title

Optional Action

---

Never contains

Search

Filters

Tabs

Statistics

---

Height

64px

---

##########################################################
DISPLAY COMPONENTS
##########################################################

==========================================================
MetricCard
==========================================================

Purpose

Display ONE metric.

Never two.

---

Structure

Label

Value

Trend

---

Example

Weight

95.45 kg

↓

-0.42

---

Never include

Buttons

Charts

Multiple values

---

Variants

Weight

Sleep

Steps

Blood Pressure

Measurements

---

==========================================================
StatChip
==========================================================

Purpose

Display short status information.

---

Examples

Today

Completed

Skipped

Pending

Optional

---

Never use paragraphs.

Maximum two words.

---

==========================================================
HistoryRow
==========================================================

Purpose

Show one historical record.

---

Layout

Date

Value

Chevron

---

Height

64px

---

Entire row is tappable.

---

##########################################################
INPUT COMPONENTS
##########################################################

==========================================================
PrimaryButton
==========================================================

Purpose

Main action.

Only one per screen.

---

Height

56px

---

States

Default

Hover

Pressed

Disabled

Loading

---

Interaction

Scale 0.98

---

==========================================================
SecondaryButton
==========================================================

Outlined.

Used for secondary actions.

---

==========================================================
GhostButton
==========================================================

Transparent.

Low emphasis.

---

==========================================================
NumberInput
==========================================================

Purpose

Fast numerical input.

---

Supports

Weight

Reps

Pressure

Pulse

Measurements

---

Behavior

Large numeric keyboard.

Auto select on focus.

Clear button.

---

==========================================================
DateTimeInput
==========================================================

Purpose

Date

Time

---

Native picker whenever possible.

---

##########################################################
WORKOUT COMPONENTS
##########################################################

==========================================================
ExerciseIllustration
==========================================================

Purpose

Teach movement immediately.

---

Size

Large.

Around one third of screen.

---

Contains

Illustration

Muscle Tag

---

Never include

Text overlays

Buttons

Decorations

---

==========================================================
WorkoutProgress
==========================================================

Purpose

Show current workout state.

---

Displays

Workout

Exercise Number

Remaining Exercises

Elapsed Time

---

Never use percentages.

---

==========================================================
ExerciseInputCard
==========================================================

Purpose

Register one exercise.

---

Contains

Illustration

Target

Previous Session

Current Set

Primary CTA

---

Must fit inside one mobile screen without scrolling.

---

==========================================================
SetInput
==========================================================

Purpose

Register one set.

---

Fields

Weight

Repetitions

---

Buttons

+

-

Duplicate Previous

---

Never ask for unnecessary information.

---

==========================================================
RestTimer
==========================================================

Purpose

Own the user's attention during rest.

---

Displays

Animated Ring

Countdown

Next Exercise

Next Set

---

Actions

Skip

+30 Seconds

Choose Exercise

Continue Current

---

Should feel satisfying.

Not stressful.

---

##########################################################
NAVIGATION COMPONENTS
##########################################################

==========================================================
BottomNavigation
==========================================================

Tabs

Home

Calendar

Train

Progress

More

---

Train tab

Largest.

Always centered.

---

==========================================================
BottomSheet
==========================================================

Purpose

Quick interaction.

---

Uses

Editing

Selection

Quick Forms

---

Never fullscreen by default.

---

==========================================================
ConfirmationDialog
==========================================================

Purpose

Critical confirmation.

---

Used only for

Delete

Discard

Logout

Never use for editing.

---

##########################################################
CHART COMPONENTS
##########################################################

==========================================================
ChartCard
==========================================================

Purpose

Tell one story.

---

Contains

Title

Chart

Summary

Trend

---

Never display multiple charts.

---

==========================================================
WeightChart
==========================================================

Displays

Daily Weight

Moving Average

Target Line

---

Never compare different metrics.

---

==========================================================
ExerciseProgressChart
==========================================================

Displays

Load

Repetitions

Personal Best

---

One exercise only.

---

##########################################################
FEEDBACK COMPONENTS
##########################################################

==========================================================
Toast
==========================================================

Purpose

Temporary feedback.

---

Duration

3 seconds

---

Position

Bottom

---

Never block interaction.

---

==========================================================
EmptyState
==========================================================

Contains

Illustration

Title

Description

Primary CTA

---

Never show only text.

---

==========================================================
LoadingSkeleton
==========================================================

Every screen has one.

Never use spinners as the primary loading state.

---

##########################################################
COMMON RULES
##########################################################

Every component must:

Use design tokens

Support dark text on light surfaces

Be responsive

Be accessible

Use semantic HTML

Have loading state

Have empty state when appropriate

Have disabled state if interactive

Support keyboard navigation where applicable

---

##########################################################
ANTI PATTERNS
##########################################################

Never create:

Cards inside cards

Buttons inside cards inside cards

Tiny buttons

Floating widgets everywhere

Random colors

Different shadows

Different radius

Different typography

Inconsistent spacing

Duplicated components

---

##########################################################
QUALITY CHECKLIST
##########################################################

Before creating a component ask:

Can an existing component solve this?

Does it answer only one problem?

Can it be reused?

Can it be simplified?

Would it look good in every screen?

If not,

redesign it.

---

# Final Rule

Components are the visual language of TRAZA.

Every new component should feel like it has always existed in the product.

If a component looks generic,

it is not finished.