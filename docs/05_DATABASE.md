# DATABASE.md

Version: 1.0

---

# Philosophy

The database is designed around one principle.

**History can never be lost.**

Every workout.

Every weight.

Every routine.

Every exercise.

Every version.

Everything remains queryable forever.

The database should prioritize:

1. Clarity

2. Data integrity

3. Evolution

4. Historical consistency

Never optimize prematurely.

Never denormalize without a clear reason.

---

# Database Engine

Supabase PostgreSQL

UUID primary keys

Row Level Security enabled on every user table.

Timestamps on every table.

Soft delete only where historical preservation matters.

---

# Naming

Tables

snake_case

Singular names are NOT allowed.

Examples

weight_entries

workout_sessions

exercise_images

Never

weight

session

exercise

---

Columns

snake_case

Booleans

is_

has_

Dates

*_date

Times

*_time

Identifiers

*_id

---

# Common Columns

Almost every table contains

id

uuid

user_id

uuid

created_at

timestamp

updated_at

timestamp

---

# USERS

profiles

Purpose

Application users.

Current MVP uses one user.

Architecture supports multiple users.

Columns

id

auth_user_id

display_name

email

avatar_url

created_at

updated_at

---

# DAILY TRACKING

#######################################################

weight_entries

#######################################################

One record per user and date.

Columns

id

user_id

entry_date

entry_time

weight_kg

numeric(5,2)

body_fat_pct

numeric(4,1)

created_at

updated_at

Unique

user_id

entry_date

---

blood_pressure_entries

Columns

id

user_id

entry_date

entry_time

systolic

smallint

diastolic

smallint

pulse

smallint

created_at

updated_at

Unique

user_id

entry_date

---

step_entries

Columns

id

user_id

entry_date

steps

integer

created_at

updated_at

Unique

user_id

entry_date

---

sleep_entries

Columns

id

user_id

entry_date

bed_time

time

wake_time

time

duration_minutes

integer

score

smallint

created_at

updated_at

Unique

user_id

entry_date

---

body_measurements

Columns

id

user_id

entry_date

waist_cm

numeric(5,1)

right_arm_cm

numeric(5,1)

right_thigh_cm

numeric(5,1)

created_at

updated_at

Unique

user_id

entry_date

---

# EXERCISES

#######################################################

exercise_groups

#######################################################

Reference table.

id

name

sort_order

---

Initial values

Chest

Back

Shoulders

Quadriceps

Hamstrings

Glutes

Biceps

Triceps

Calves

Core

Full Body

Cardio

Other

---

exercise_types

#######################################################

Reference table.

Values

Weight

Bodyweight

Time

Cardio

---

load_types

#######################################################

Reference table.

Values

Total Weight

Per Dumbbell

Per Side

Assistance

---

exercises

#######################################################

Purpose

Master exercise library.

Columns

id

group_id

type_id

load_type_id

name

image_path

technique_tip

configuration_note

is_archived

created_at

updated_at

---

exercise_alternatives

#######################################################

Many-to-many

exercise_id

alternative_exercise_id

---

# ROUTINES

#######################################################

workout_templates

#######################################################

Logical routine.

Example

DAY A

DAY B

DAY C

HOME

Columns

id

name

description

is_archived

created_at

updated_at

---

workout_template_versions

#######################################################

Every modification creates a version.

Columns

id

template_id

version_number

created_at

---

workout_template_exercises

#######################################################

Columns

id

template_version_id

exercise_id

display_order

sets

min_reps

max_reps

target_seconds

min_rir

max_rir

rest_seconds

pair_group

is_required

notes

---

# WORKOUTS

#######################################################

workout_sessions

#######################################################

One workout.

Columns

id

user_id

template_id

template_version_id

session_date

start_time

end_time

duration_minutes

status

completed

partial

cancelled

created_at

updated_at

---

workout_session_exercises

#######################################################

Each exercise performed.

Columns

id

session_id

planned_exercise_id

performed_exercise_id

planned_order

performed_order

status

completed

partial

skipped

last_set_rir

notes

---

workout_sets

#######################################################

Every effective set.

Columns

id

session_exercise_id

set_number

load

numeric(6,2)

repetitions

smallint

duration_seconds

integer

created_at

---

# EXPORT

No export tables.

Exports are generated dynamically.

---

# ENUMS

Prefer lookup tables instead of PostgreSQL enums.

Reason

Easy editing

Translations

Sorting

Metadata

Future growth

---

# INDEXES

Unique

user_id + entry_date

on all daily modules

---

Workout history

user_id

session_date desc

---

Exercise history

performed_exercise_id

session_date desc

---

Charts

entry_date

All tracking tables

---

# RLS

Every user can

SELECT own rows

INSERT own rows

UPDATE own rows

DELETE own rows

No cross-user visibility.

---

# DELETE STRATEGY

Never hard delete

Workout Sessions

Workout Sets

Template Versions

Instead

archive

or

soft delete

Exercises without history may be deleted.

---

# STORAGE

Exercise illustrations

/public/exercises

Not stored in Supabase Storage initially.

Database stores only relative path.

---

# FILE EXPORTS

Generated dynamically.

Never persisted.

---

# FUTURE TABLES

Not implemented now.

coach_notes

injuries

nutrition

lab_results

wearables

goals

notifications

ai_insights

badges

personal_records

Do not create them yet.

---

# Golden Rule

The database exists to preserve history.

Never modify historical data to reflect today's configuration.

History is immutable.

Templates evolve.

History never changes.