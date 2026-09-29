---
name: Academic Velocity
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#434654'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#737686'
  outline-variant: '#c3c5d7'
  surface-tint: '#1353d8'
  primary: '#003fb1'
  on-primary: '#ffffff'
  primary-container: '#1a56db'
  on-primary-container: '#d4dcff'
  inverse-primary: '#b5c4ff'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cea700'
  on-tertiary-container: '#4e3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b5c4ff'
  on-primary-fixed: '#00174d'
  on-primary-fixed-variant: '#003dab'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#ffe083'
  tertiary-fixed-dim: '#eec200'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#574500'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The brand personality is authoritative yet encouraging, bridging the gap between rigorous academic preparation and modern technological efficiency. The target audience consists of Chilean high school students and graduates preparing for the PAES, requiring a UI that feels organized, stress-reducing, and results-oriented.

The design style follows a **Corporate / Modern** aesthetic with a heavy emphasis on **Minimalism**. It utilizes expansive negative space to reduce cognitive load during study sessions. Visual interest is generated through precise typographic scaling and high-quality functional color application rather than decorative elements. The interface should feel like a high-performance tool: reliable, fast, and professional.

## Colors
This design system uses a logic-driven palette where color equals function. 

- **Primary Action (Deep Blue):** Reserved for the main "Path of Success"—starting lessons, submitting exams, and primary navigation.
- **Recommendation/Accent (Vibrant Orange):** Used exclusively for AI-driven insights, personalized recommendations, and "weak spot" alerts.
- **Premium (Golden Yellow):** Applied to specialized features, advanced analytics, and "Pro" tier content.
- **Success/Error:** High-visibility indicators for correct/incorrect answers in practice tests.
- **Structure:** Text uses a high-contrast charcoal (#111827) against a clean white or subtle gray (#F9FAFB) background to ensure maximum legibility during long reading sessions.

## Typography
Inter is selected for its exceptional legibility in digital interfaces and its neutral, systematic tone. The hierarchy is strictly enforced to help students distinguish between instructional content, questions, and UI metadata.

- **Headlines:** Use Bold weights for top-level navigation and semi-bold for section headers within study modules.
- **Body:** Use a 16px base for standard text. For long-form reading or question prompts, use `body-lg` (18px) to reduce eye strain.
- **Labels:** Small, medium-weight caps are used for category tags (e.g., "MATEMÁTICA", "COMPRENSIÓN LECTORA").

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to keep content centered and readable, preventing long line lengths that hinder reading comprehension. 

- **Desktop:** 12-column grid with a 1280px max-width. Large 48px outer margins create a "breathing room" effect that reinforces the professional, calm brand personality.
- **Mobile:** Single column with 16px margins.
- **Rhythm:** Use an 8px base unit for all internal component spacing (padding, gaps). High vertical rhythm (`stack-lg`) should be used between different subjects or modules to clearly demarcate content blocks.

## Elevation & Depth
This design system utilizes **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized hierarchy.

- **Level 0 (Background):** #F9FAFB. The canvas for all content.
- **Level 1 (Cards):** White (#FFFFFF) surfaces with a very subtle 1px border (#E5E7EB) and a soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)). This level is used for lesson cards and question blocks.
- **Level 2 (Active/Hover):** Increased shadow depth (0px 8px 30px rgba(0, 0, 0, 0.08)) to indicate interactivity.
- **Floating Elements:** Modals and tooltips use a high-contrast shadow to separate them clearly from the underlying study material.

## Shapes
The shape language is friendly and modern. A standard radius of **12px (rounded-lg)** is the primary choice for cards and large containers, providing a approachable feel.

- **Standard Elements:** 8px for buttons and input fields to maintain a professional structural integrity.
- **Large Containers:** 16px (rounded-xl) for dashboard widgets and main content wrappers.
- **Pills:** Used exclusively for status indicators (e.g., "Completed", "In Progress") and chips.

## Components
- **Buttons:** Primary buttons use the Deep Blue background with white text. Hover states should darken the blue slightly. Secondary buttons use a transparent background with a 1px Blue border.
- **Inputs:** Clean white backgrounds with #D1D5DB borders. On focus, the border shifts to Primary Blue with a 2px outer glow. Validation states (Error/Success) must change the border color and include an icon for accessibility.
- **Progress Indicators:** Use a thick (8px) stroke for progress bars. Use Emerald Green for "Completed" sections and Primary Blue for "In Progress."
- **Study Cards:** White background, 12px corner radius, subtle shadow. Cards should include a category chip at the top left and a progress percentage at the bottom.
- **Data Visualization:** Simple, clean line charts for score history. Use Blue for the main score line and a dashed Orange line for the "Target Goal."
- **Checkboxes/Radios:** Large hit-targets (min 44px) for mobile-friendly test-taking. Active states use a solid Blue fill with a white check/dot.