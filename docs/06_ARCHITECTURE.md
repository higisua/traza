# ARCHITECTURE.md

Version: 1.0

---

# Purpose

This document defines the software architecture of TRAZA.

The goal is to build a project that remains easy to maintain for years.

Architecture should prioritize:

- readability
- scalability
- separation of concerns
- developer experience
- testability

Never optimize prematurely.

Never over-engineer.

---

# Stack

Framework

Next.js App Router

Language

TypeScript (strict)

Styling

Tailwind CSS

Backend

Supabase

Deployment

Vercel

Forms

React Hook Form

Validation

Zod

Charts

Recharts

Icons

Lucide

Tables

TanStack Table (only if really needed)

Dates

date-fns

---

# General Principles

Business logic must never live inside pages.

Business logic must never live inside UI components.

Components render.

Actions execute.

Repositories access data.

Everything has one responsibility.

---

# Folder Structure

/app

Authenticated routes

Public routes

Layouts

Loading states

Error states

Server Components

---

/components

Reusable UI only.

No business logic.

Grouped by domain.

Example

components

dashboard

training

calendar

charts

common

layout

forms

navigation

feedback

---

/features

Contains business functionality.

Each feature owns:

components

actions

schemas

types

repositories

utils

hooks

Example

features

training

dashboard

sleep

weight

calendar

blood-pressure

steps

measurements

progress

export

settings

---

/lib

Framework configuration.

Examples

supabase

auth

date

format

env

constants

Never business logic.

---

/types

Global shared types.

Avoid duplication.

---

/styles

Global css

Tailwind

Variables

---

/public

Images

Exercise illustrations

Logo

Icons

---

/docs

Project documentation.

---

# Feature Structure

Example

features/training

components

ExerciseCard.tsx

WorkoutHero.tsx

RestTimer.tsx

ExerciseList.tsx

actions

createWorkout.ts

updateWorkout.ts

finishWorkout.ts

repositories

trainingRepository.ts

schemas

workoutSchema.ts

types

training.ts

utils

trainingUtils.ts

hooks

useWorkout.ts

Only feature-specific code lives here.

---

# Components

Components never fetch data directly.

Components receive data.

Components emit events.

Nothing more.

---

Bad

ExerciseCard

↓

Supabase query

↓

Render

Good

Page

↓

Server Action

↓

Repository

↓

Component

---

# Pages

Pages compose features.

Nothing else.

Example

Dashboard page

Imports

DashboardHero

MetricCards

WeeklyActivity

QuickActions

RecentProgress

Pages should remain extremely small.

---

# Repositories

Repositories are the only layer allowed to communicate with Supabase.

Never call Supabase directly from:

Components

Pages

Hooks

Actions

Everything goes through repositories.

Example

weightRepository

getLatestWeight()

createWeight()

updateWeight()

deleteWeight()

---

# Actions

Actions execute business operations.

Examples

Start Workout

Finish Workout

Save Weight

Update Blood Pressure

Generate Export

Actions may call multiple repositories.

---

# Validation

Every input must have:

Zod schema

TypeScript type

Server validation

Never trust client validation only.

---

# Server Components

Default choice.

Everything should be a Server Component unless interaction is needed.

---

# Client Components

Use only for

Forms

Animations

Charts

Workout Mode

Calendar interaction

Bottom Sheets

Timers

Anything interactive

Everything else should remain server rendered.

---

# State Management

Avoid global state.

Prefer local state.

Hierarchy

URL

↓

Server State

↓

Local State

↓

Context

↓

Global Store

Global stores are the last option.

Avoid Redux.

Avoid Zustand unless truly necessary.

---

# Forms

Every form uses

React Hook Form

+

Zod

Never manually manage dozens of useState.

---

# Data Fetching

Read

Server Components

Write

Server Actions

Realtime not required.

---

# Caching

Use Next.js cache.

Revalidate only when necessary.

Never disable cache globally.

---

# Optimistic UI

Use optimistic updates whenever possible.

Especially for

Weight

Steps

Sleep

Workout Sets

The application should feel instant.

---

# Error Handling

Errors never reach the UI directly.

Create domain errors.

Translate them into user-friendly messages.

---

# Logging

Console logs only in development.

Production uses structured logging.

Never leave debug logs.

---

# Environment Variables

Only

NEXT_PUBLIC_

for public variables.

Everything else remains server-side.

Never expose Supabase Service Role.

---

# Database Access

Use typed Supabase client.

Generate database types.

Never use any.

---

# Naming

Components

PascalCase

Hooks

useSomething

Actions

verbObject

Repositories

entityRepository

Utils

camelCase

Types

PascalCase

Interfaces

Avoid unless necessary.

Prefer type.

---

# Imports

Absolute imports.

Never ../../../..

Use aliases.

Example

@/features/training

---

# CSS

Tailwind only.

Global CSS only for:

reset

variables

fonts

scrollbar

selection

Nothing else.

---

# Design Tokens

Every visual value comes from

DESIGN_TOKENS.md

Never hardcode:

colors

radius

spacing

shadows

animation durations

---

# Images

Use Next Image.

Always.

Exercise illustrations stored in public.

---

# Icons

Lucide only.

No mixed icon libraries.

---

# Charts

One reusable chart system.

Never create chart components from scratch every time.

---

# Accessibility

Semantic HTML.

Keyboard navigation.

ARIA where appropriate.

Visible focus.

Screen reader friendly.

---

# Testing

Not required in MVP.

Architecture should allow testing later.

---

# Performance

Split code by route.

Lazy load heavy components.

Lazy load charts.

Optimize images.

Avoid unnecessary client rendering.

---

# Security

Every server action validates ownership.

Never trust IDs from the client.

RLS is mandatory.

---

# Documentation

Every feature contains:

README.md

explaining:

purpose

main components

business rules

Only when complexity justifies it.

---

# Anti Patterns

Never

Supabase inside components

Business logic inside pages

Huge hooks

Huge utility files

God components

Massive Context providers

Copy-pasted code

Magic numbers

Hardcoded colors

Inline styles

Relative import hell

---

# Golden Rule

Every file should answer one question.

If a file starts doing two different jobs,

split it.