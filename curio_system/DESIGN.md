---
name: Curio System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb693'
  primary: '#ffb693'
  on-primary: '#561f00'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#a04100'
  secondary: '#ffffff'
  on-secondary: '#1e3700'
  secondary-container: '#9bfc00'
  on-secondary-container: '#427000'
  tertiary: '#ddb7ff'
  on-tertiary: '#490080'
  tertiary-container: '#bd79ff'
  on-tertiary-container: '#4a0081'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#9bfc00'
  secondary-fixed-dim: '#87dd00'
  on-secondary-fixed: '#0f2000'
  on-secondary-fixed-variant: '#2e4f00'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb7ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6900b3'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max-width: 1440px
---

## Brand & Style

The design system is engineered to bridge the gap between high-velocity streaming and technical precision. It targets a generation of decentralized learners who value both speed of information and the security of blockchain technology.

The visual direction follows a **Corporate / Modern** framework infused with **Glassmorphism**. The result is a "High-End Dashboard" aesthetic that feels immersive and premium. By utilizing deep charcoal foundations and vibrant citrus accents, the system evokes a sense of intellectual energy and technological sophistication. 

Key attributes:
- **Premium:** Refined gradients and subtle depth.
- **Dynamic:** 3D assets and high-contrast accents imply movement and growth.
- **Systematic:** A structured layout that organizes complex data into digestible micro-lectures.

## Colors

The palette centers on a "Deep Space" charcoal base to ensure maximum focus on content and data visualizations. 

- **Primary (Vibrant Orange):** Used exclusively for high-priority CTAs, progress indicators, and active states. It represents the "spark" of curiosity.
- **Secondary (Neon Green):** Reserved for technical blockchain status (e.g., successful transactions, Aptos chain details).
- **Tertiary (Purple):** Used for advanced metadata and secondary technical details (e.g., Ethereum/Solana chain identifiers).
- **Neutrals:** A range of slate grays are used to create the "High-End Dashboard" layering. Surface colors should use subtle transparency when layered over backgrounds to maintain the glassmorphic effect.

## Typography

Typography focuses on hyper-legibility for educational content. 

- **Headlines:** Use Hanken Grotesk for a sharp, contemporary look. Tight letter-spacing on larger sizes creates a professional, editorial feel.
- **Body:** Inter provides a neutral, utilitarian canvas for long-form lecture descriptions and notes.
- **Technical Labels:** JetBrains Mono is utilized for blockchain-related data, wallet addresses, and timestamps to emphasize the decentralized nature of the platform.
- **Hierarchy:** Maintain high contrast between headlines and body copy. Use primary orange for emphasized keywords within body text or headers to guide the eye.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a standard 12-column desktop structure. 

- **Grid:** On desktop, use a 1440px max-width container with 24px gutters. Margins are generous (64px) to create an airy, premium feel that avoids the "cluttered" look of traditional dashboards.
- **Rhythm:** All spacing (padding, margins) must be multiples of the 4px base unit. 
- **Reflow:** On mobile, the grid collapses to a single column with 20px side margins. Horizontal scrolling "shelves" should be used for micro-lecture categories to maintain a streaming-first experience.

## Elevation & Depth

This design system uses a **Glassmorphic** approach to depth rather than traditional shadows.

- **Surface Layers:** Surfaces are created with semi-transparent fills (e.g., `rgba(22, 22, 22, 0.7)`) combined with a 20px-40px backdrop blur.
- **Outlines:** Instead of heavy shadows, use thin (1px) borders with low-opacity white (10-15%) to define the edges of containers against the dark background.
- **Top Layer:** Active modals or 3D assets should have a subtle, wide-spread ambient glow in the primary orange color to simulate light emission.

## Shapes

The shape language is "Soft-Modern," using significant corner rounding to balance the technical "dark mode" aesthetic with an approachable feel.

- **Base Radius:** 8px for small components like inputs and checkboxes.
- **Standard (Rounded):** 12px for buttons and list items.
- **Large (rounded-lg):** 24px for main content cards and video player containers.
- **Pill-shaped:** Used exclusively for tags, status indicators (e.g., "Live"), and chain identifiers.

## Components

- **Buttons:** Primary buttons use a solid orange fill with black text for maximum contrast. Secondary buttons use the glassmorphic style (blurred background + white border).
- **Cards:** Feature a 1px border-top highlight to catch "virtual light." Cards for lectures should include a progress bar at the bottom using the primary orange.
- **Chips / Chain Labels:** Small, pill-shaped elements with technical fonts. Use background tints of green/purple with matching text colors for blockchain identifiers.
- **Input Fields:** Darker than the surface color, with an orange 2px border on focus. Icons should be used to indicate data types (e.g., wallet icon for address fields).
- **Video Player:** The centerpiece of the system. It should feature an ultra-minimalist overlay, using glassmorphic controls that disappear during playback.
- **3D Assets:** Incorporate high-quality, playful 3D icons (like the citrus-toned hardware in the reference) to mark achievements, course completion, or platform milestones.