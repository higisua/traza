# DESIGN_TOKENS.md

Version: 1.0

---

# Purpose

Design Tokens define the visual language of TRAZA.

They are the single source of truth for:

- colors
- spacing
- typography
- radius
- shadows
- animations
- borders
- layout
- elevation
- icon sizing

Never hardcode visual values inside components.

Always reference design tokens.

---

# Brand

Product

TRAZA

Tagline

TRAIN.
TRACK.
EVOLVE.

Design Keywords

Premium

Minimal

Athletic

Elegant

Focused

Timeless

Calm

---

# Colors

## Brand

Primary

#C7F43D

Primary Hover

#B7E634

Primary Pressed

#A8D62B

Primary Soft

#EEF9C8

---

## Backgrounds

Background

#F6F7F3

Surface

#FFFFFF

Surface Secondary

#ECEFE8

Surface Hover

#F2F4EF

---

## Borders

Border Light

#E7EAE4

Border Default

#DDE1DA

Border Strong

#C8CEC5

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

Inverse

#FFFFFF

---

## Semantic

Success

#46B96B

Warning

#F6B436

Danger

#E45C4C

Info

#4A84FF

---

## Chart Palette

Weight

#171A17

Moving Average

#C7F43D

Goal

#A8D62B

Grid

#ECEFE8

Points

#BFC4BC

---

# Typography

## Font Family

Primary

Inter

Fallback

system-ui

sans-serif

Never use another font.

---

## Font Weights

Regular

400

Medium

500

SemiBold

600

Bold

700

Never use 800 or 900.

---

## Font Sizes

Display XL

48

Display

40

Hero Number

36

Section

28

Card Title

20

Body

16

Caption

13

Label

11

---

## Line Heights

Display

1.0

Titles

1.15

Body

1.5

Caption

1.4

---

## Letter Spacing

Display

-2%

Titles

-1%

Body

0%

Labels

2%

---

# Spacing

Use an 8-point grid.

Allowed values:

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

128

Never invent intermediate spacing.

---

# Border Radius

XS

8

S

12

M

18

L

24

XL

32

2XL

40

---

# Shadows

Shadow XS

0 2px 6px rgba(0,0,0,.04)

Shadow S

0 4px 12px rgba(0,0,0,.06)

Shadow M

0 8px 24px rgba(0,0,0,.08)

Shadow L

0 16px 48px rgba(0,0,0,.12)

Never stack shadows.

---

# Borders

Default

1px solid Border Default

Focus

2px solid Primary

Danger

2px solid Danger

---

# Icons

Library

Lucide

Sizes

16

20

24

32

40

Never use arbitrary icon sizes.

---

# Buttons

Primary

Height

56

Radius

18

Padding X

24

Gap

8

Elevation

Shadow S

Secondary

Height

56

Radius

18

Outlined

Ghost

Transparent

Danger

Outlined

---

# Inputs

Height

52

Radius

16

Padding X

16

Label Gap

8

---

# Cards

Radius

24

Padding

24

Gap

24

Elevation

Shadow M

Maximum Width

100%

---

# Hero Card

Radius

32

Padding

32

Minimum Height

220

Elevation

Shadow L

One Hero Card per screen.

---

# Bottom Sheet

Radius

32

Handle Width

48

Handle Height

4

Top Padding

16

Horizontal Padding

24

Bottom Safe Area

Always respected

---

# Navigation

Bottom Bar Height

72

Safe Area Included

Yes

Active Icon

Primary

Inactive Icon

Secondary

Train Tab

Larger than others

---

# Charts

Corner Radius

16

Grid Width

1

Grid Color

Border Light

Line Width

3

Point Size

6

Moving Average Width

4

Animation

600ms

Ease Out

---

# Animations

Fast

150ms

Normal

200ms

Slow

300ms

Page Transition

250ms

---

# Easing

Standard

ease-out

Spring

cubic-bezier(.22,1,.36,1)

Exit

ease-in

---

# Motion

Buttons

Scale

0.98

Cards

TranslateY

-2px

Charts

Draw

Counters

Count Up

Sheets

Slide Up

Pages

Fade + Slide

---

# Opacity

Disabled

40%

Muted

60%

Hover Overlay

4%

Pressed Overlay

8%

---

# Layout

Reference Width

390

Desktop Max Width

1280

Content Max Width

720

Forms Max Width

560

Charts Max Width

900

---

# Safe Areas

Always respect:

Top

Bottom

Keyboard

Dynamic Island

Gesture Area

---

# Z Index

Navigation

100

Bottom Sheet

200

Dialog

300

Toast

400

Loading Overlay

500

---

# Images

Exercise Illustrations

Ratio

4:5

Background

Transparent

Format

WebP

Master

PNG

Resolution

1200x1500

---

# Charts

Never use:

3D

Gradients

Drop Shadows

Heavy grids

Always:

Minimal

Readable

One story per chart

---

# Accessibility

Minimum Touch Target

48

Preferred

56

Minimum Contrast

WCAG AA

Focus Ring

Always visible

Never remove focus styles.

---

# Component Rules

Every component must use tokens.

No hardcoded values.

No inline colors.

No random spacing.

No custom shadows.

No custom radius.

No custom animation duration.

Everything references the design system.

---

# Golden Rule

Consistency beats creativity.

Every new component should look like it has always belonged to TRAZA.