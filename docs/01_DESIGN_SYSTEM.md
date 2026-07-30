# DESIGN_SYSTEM.md

Version: 1.0

---

# 1. Design Philosophy

The visual design of TRAZA is based on one simple idea.

**Progress deserves beauty.**

The application exists to help users improve over months and years.

The interface should make this journey enjoyable.

Beauty is not decoration.

Beauty is usability.

Every animation, every spacing decision, every transition and every screen exists to make progress feel rewarding.

---

# 2. Brand Personality

TRAZA is:

• Premium

• Focused

• Calm

• Athletic

• Modern

• Precise

• Intelligent

Never:

• Loud

• Aggressive

• Gamified

• Medical

• Corporate

• Futuristic

The interface should feel timeless.

---

# 3. Visual Inspiration

The application should take inspiration from:

• Apple Health

• Oura

• Gentler Streak

• Freeletics

• Linear

• Arc Browser

• Notion Calendar

Do NOT imitate them.

Only learn from:

- spacing
- hierarchy
- typography
- polish
- interactions

---

# 4. Color System

## Primary

Lime 500

#C7F43D

Main brand color.

Reserved for:

- primary CTA
- progress
- active states
- timers
- completion

---

Lime 600

#A8D62B

Pressed buttons.

---

Lime 100

#EEF9C8

Very light backgrounds.

Never use for text.

---

## Neutral

Background

#F6F7F3

---

Card

#FFFFFF

---

Secondary Surface

#ECEFE8

---

Border

#DDE1DA

---

Divider

#E9ECE6

---

## Text

Primary

#171A17

Secondary

#697068

Muted

#939A93

Disabled

#B8BDB7

---

## Semantic

Success

#46B96B

Warning

#F6B436

Error

#E45C4C

Info

#4A84FF

---

# 5. Typography

Font Family

Inter

No alternatives.

Use Next Font optimization.

Weights

400

500

600

700

Never use 800 or 900.

---

Typography Scale

Display XL

48

Bold

---

Display

40

Bold

---

Hero Number

36

Bold

---

Section Title

28

SemiBold

---

Card Title

20

SemiBold

---

Body

16

Regular

---

Caption

13

Medium

---

Small Label

11

Medium

---

Numbers

Use tabular figures.

Numbers should never visually jump.

---

# 6. Spacing System

The interface breathes.

Spacing is more important than borders.

Allowed spacing values:

4

8

12

16

24

32

40

48

64

96

Avoid arbitrary spacing.

Never use:

7

13

19

27

etc.

---

# 7. Border Radius

Small

12

Medium

18

Large

24

XL

32

Use the same radius system everywhere.

---

# 8. Shadows

Cards should appear elevated without looking floating.

Small

0 2px 8px rgba(0,0,0,.05)

Medium

0 8px 24px rgba(0,0,0,.08)

Large

0 16px 48px rgba(0,0,0,.12)

Never use hard shadows.

---

# 9. Icons

Library:

Lucide

Icons support content.

Icons never replace labels.

Maximum:

One meaningful icon per card.

Avoid decorative icons.

---

# 10. Buttons

Primary

Height

56px

Radius

18px

Background

#C7F43D

Text

#171A17

Shadow

Small

Pressed

Scale 0.98

---

Secondary

White background

Grey border

Dark text

---

Ghost

Transparent

No border

---

Danger

White

Red text

Red border

---

Disabled

Grey background

Muted text

No shadow

---

# 11. Inputs

Height

52px

Radius

16px

Border

#DDE1DA

Background

White

Focused

2px Lime outline

Placeholder

Muted

Large touch targets.

---

# 12. Cards

Cards answer one question.

Never combine unrelated information.

Padding

24px

Radius

24px

Avoid nested cards.

---

# 13. Motion

Motion communicates continuity.

Nothing should instantly appear.

Duration

150–250ms

Small elements

ease-out

Large elements

Spring animation

Examples

Buttons

Scale

Cards

Lift

Counters

Count animation

Charts

Progressive draw

Timer

Continuous ring animation

---

# 14. Page Transitions

Pages should fade and slightly slide.

Never abruptly replace content.

The user should always understand where they came from.

---

# 15. Microinteractions

Every interaction should produce feedback.

Button

Compresses slightly.

Card

Lifts slightly.

Chart

Animates.

Progress

Interpolates.

Workout completed

Small success animation.

Never use confetti.

---

# 16. Dashboard

The dashboard is today's command center.

No scrolling should be required to understand today's status.

Order:

1

Greeting

2

Today's primary action

3

Key metrics

4

Recent evolution

5

Quick actions

---

# 17. Calendar

The calendar is a visual timeline.

The user should understand an entire month in under three seconds.

Avoid visual clutter.

---

# 18. Workout Mode

Workout Mode is immersive.

Hide distractions.

Hide unnecessary navigation.

One exercise.

One illustration.

One action.

Everything else is secondary.

---

Exercise illustration occupies approximately one third of the screen.

Numbers are oversized.

Timer dominates the interface.

---

# 19. Charts

Charts answer questions.

Not display data.

Weight

Show:

Daily points

7-day moving average

Target line

Minimal horizontal grid

No vertical grid

---

Strength

Show:

Progress by exercise

Do not compare unrelated exercises.

---

Sleep

Show:

Duration

Score

Weekly average

---

Blood Pressure

Show:

Systolic

Diastolic

Trend

---

# 20. Empty States

Never display:

"No data"

Instead:

Illustration

Short explanation

Primary action

Examples

Start your first workout.

Record today's weight.

Measure your waist.

---

# 21. Loading

Always use skeletons.

Preserve layout.

Avoid layout shifts.

Loading should feel intentional.

---

# 22. Error States

Explain:

What happened.

What can be done.

Never blame the user.

---

# 23. Responsive

390px is the design reference.

Desktop adapts.

Desktop never redesigns workflows.

---

# 24. Accessibility

Contrast AA minimum.

Touch targets

48px minimum.

Never rely on color alone.

Keyboard accessible where appropriate.

---

# 25. Design Rules

Before shipping any screen ask:

Can I remove something?

Is there one obvious action?

Can it be used with one thumb?

Is the hierarchy obvious?

Would this look good in a Dribbble shot?

Would Apple approve this interaction?

Would Linear publish this screen?

If any answer is no,

redesign the screen.

---

# 26. Golden Rule

Never add features to compensate for weak design.

Design is the feature.
