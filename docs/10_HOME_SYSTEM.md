# Home Visual System — «Instrumento Premium»

Version: 2.0  
Status: Active  
Scope: Home (Header · Estado · Entrenamiento · Bottom Nav)

---

## Design intent

Optimize for **desirability**, not emptiness.

Someone should open TRAZA and think: *qué aplicación tan bonita, apetece usarla.*

Precision + warmth + craft. Consumer product quality (Apple / Oura / Arc / Linear), never a wireframe and never an admin dashboard.

---

## Color & materials

| Use | Spec |
|-----|------|
| Page canvas | Soft atmospheric wash: primary-soft → background |
| Header | Subtle vertical gradient primary-soft → transparent |
| Module surfaces | White elevated tiles with soft shadow + hairline ring |
| Compact modules | `surface-secondary` tiles (lower elevation) |
| Weight tile | White + soft lime atmospheric glow (protagonist) |
| Icon wells | Soft capsule `primary-soft` for all modules (one rule) |
| Training | Warm `#FFF8ED` + radial lime highlight + soft shadow |
| Lime solid | Primary CTA only |

---

## Hierarchy (non-uniform)

| Level | Modules | Treatment |
|-------|---------|-----------|
| L1 | Peso | Full width, Value 30px, lime glow, taller pad |
| L2 | Tensión, Sueño | Half width, Value 20px, white elevated |
| L3 | Pasos, Medidas | Half width, Value 16px, secondary surface |
| Special | Entrenamiento | Warm material, illustration, lime CTA |

---

## Icon rule (universal)

- Soft rounded square well (`10px` radius)
- Background: `primary-soft`
- Icon: 16px, stroke 2, text-primary
- Position: top-right of every module
- Never raw icons without a well

---

## Typography rhythm

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Brand | 22px | 700 | -0.035em |
| Date | 12px | 500 | 0.02em |
| Section | 11px | 600 | 0.08em · uppercase · muted |
| Label | 11px | 500 | 0.06em · uppercase · muted |
| Value L | 30px | 700 | -0.03em |
| Value M | 20px | 650≈600 | -0.02em |
| Value S | 16px | 600 | -0.015em |
| Support / meta | 12–13px | 500 | 0 |
| Training title | 20px | 700 | -0.025em |

---

## Depth

- Elevated tiles: `shadow-s` + `ring-1 ring-black/4%`
- Protagonist: larger soft glow behind
- Training: `shadow-m` + inner light
- Press: scale 0.985 + slight shadow tighten

---

## Viewport

Header + Estado + Entrenamiento visible without scroll on modern iPhone.
Achieved by composition density, not by stripping materials.
