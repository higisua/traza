# DEVELOPMENT_GUIDE.md

Version: 1.0

---

# Purpose

This document defines how TRAZA must be developed.

It is not about features.

It is about engineering discipline.

Every implementation should follow these principles.

When in doubt, this document has priority over implementation speed.

---

# Project Philosophy

TRAZA is a premium product.

Not a prototype.

Not a demo.

Not an internal tool.

Every line of code should move the product closer to something that could be commercially released.

Never build "temporary" solutions.

There is nothing more permanent than temporary code.

---

# Documentation First

Before implementing anything, always read:

1. PRODUCT.md
2. DESIGN_SYSTEM.md
3. DESIGN_TOKENS.md
4. COMPONENTS.md
5. SCREEN_SPECS.md
6. DATABASE.md
7. ARCHITECTURE.md
8. ROADMAP.md
9. COPYWRITING.md

If documentation and code disagree,
documentation wins.

---

# Build Incrementally

Never implement multiple major features at once.

Every phase must end in a working application.

Every commit should leave the project in a deployable state.

Never leave half-finished features.

---

# Before Writing Code

Before creating any feature:

Understand the problem.

Understand the user flow.

Find existing components.

Find existing patterns.

Reuse before creating.

If something similar already exists,
extend it.

Never duplicate.

---

# Before Creating a Component

Ask:

Does this already exist?

Can I extend an existing component?

Can this become more generic?

If yes,

do not create a new component.

---

# Before Creating a Screen

Read SCREEN_SPECS.md.

The implementation should follow the wireframe.

Do not redesign screens during development.

If a screen seems incorrect,

propose improvements,

but do not silently change it.

---

# Before Changing Database

Read DATABASE.md.

Never modify database structure without updating documentation.

Never create tables that are not documented.

Never remove historical information.

History is immutable.

---

# Before Adding Dependencies

Ask:

Can this already be solved with existing libraries?

Can this be solved with native browser APIs?

Can it be solved with existing project code?

Every dependency increases maintenance cost.

Avoid unnecessary packages.

---

# Design Rules

Never invent:

colors

spacing

radius

shadows

animations

Always use DESIGN_TOKENS.md.

Never hardcode visual values.

---

# Components

Always use existing components.

Never recreate:

buttons

cards

headers

inputs

dialogs

toasts

Only extend them.

Never fork them.

---

# Business Logic

Business logic never belongs inside:

Pages

UI Components

Layouts

Business logic belongs inside Features.

---

# Data Access

Supabase access must only happen through repositories.

Never call Supabase directly from components.

Never duplicate queries.

Repositories own database access.

---

# Validation

Everything must be validated.

Client validation.

Server validation.

Database constraints.

Never trust user input.

---

# Error Handling

Errors should be predictable.

Never expose technical errors to users.

Translate errors into user-friendly language.

Never use alert().

Never use browser default dialogs.

---

# Performance

Always think about performance.

Avoid unnecessary renders.

Prefer Server Components.

Lazy load heavy modules.

Optimize images.

Avoid unnecessary client state.

Do not optimize prematurely,

but never ignore obvious performance issues.

---

# Accessibility

Every interactive element must be accessible.

Keyboard navigation.

Visible focus.

Correct labels.

Semantic HTML.

Accessibility is not optional.

---

# Mobile First

Always design for mobile first.

Desktop adapts.

Never design desktop first.

Every important interaction should work comfortably with one thumb.

---

# Animations

Animations explain state changes.

Never animate for decoration only.

Every animation should have a reason.

If animation becomes distracting,

remove it.

---

# Empty States

Never leave blank areas.

Every empty state should help the user understand what to do next.

Include:

illustration

short explanation

primary action

---

# Loading States

Never show blank screens.

Always use skeletons.

Avoid layout shift.

---

# Forms

Forms must feel effortless.

Large touch targets.

Few fields.

Automatic focus.

Good keyboard behaviour.

Fast validation.

Never ask unnecessary questions.

---

# Workout Mode

Workout Mode is sacred.

It must always feel:

focused

fast

immersive

Everything unrelated disappears.

No distractions.

---

# Commits

Commit often.

Each commit should represent one logical improvement.

Good examples:

feat: add workout session flow

feat: implement rest timer

fix: prevent duplicate daily entries

refactor: simplify exercise repository

Avoid generic commits like:

update

changes

fixes

---

# Refactoring

Leave the code cleaner than you found it.

If duplication appears,

remove it.

If naming becomes confusing,

improve it.

Never postpone obvious refactoring.

---

# Code Quality

Prefer readability over cleverness.

Prefer explicit code over magic.

Prefer composition over inheritance.

Prefer small functions.

Prefer pure functions whenever possible.

Avoid deeply nested code.

Avoid giant files.

Avoid giant hooks.

Avoid giant components.

---

# File Size

Guideline:

Components

<200 lines

Hooks

<150 lines

Repositories

<250 lines

Actions

<150 lines

If a file grows too much,

split it.

---

# Naming

Names should describe purpose.

Avoid abbreviations.

Good:

WorkoutSummary

Bad:

WS

Good:

saveWorkout()

Bad:

save()

---

# Comments

Code should explain itself.

Comments should explain WHY,

not WHAT.

Avoid obvious comments.

---

# Testing During Development

After every feature:

Build.

Run.

Navigate.

Click.

Edit.

Delete.

Repeat.

Never assume.

Verify.

---

# Pull Requests

Every PR should answer:

What was built?

Why?

What files changed?

How should it be tested?

---

# Definition of Done

A feature is finished only when:

It works.

It looks premium.

It is responsive.

It is accessible.

It has loading state.

It has empty state.

It has error state.

It has success state.

It follows the design system.

It follows the documentation.

It can be deployed.

---

# When Unsure

Do not guess.

Explain the options.

Recommend one.

Wait for confirmation when architecture could change.

---

# Golden Rule

Every decision should make TRAZA feel more like a premium product.

Never add complexity unless it creates real value.

The experience is the product.