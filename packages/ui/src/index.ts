/**
 * Ops Agenda design system.
 *
 * Every export here is presentational and framework-agnostic — no Next.js
 * imports, no server actions, no data fetching. Components style themselves
 * from the tokens in `tokens.css`; import `@ops-agenda/ui/styles.css` (or the
 * tokens alone) for them to render correctly.
 */

// Controls
export { Button, ButtonLink } from './components/button';
export type { ButtonProps, ButtonLinkProps } from './components/button';

// Form fields
export { TextField } from './components/text-field';
export type { TextFieldProps } from './components/text-field';
export { TextareaField } from './components/textarea';
export type { TextareaFieldProps } from './components/textarea';
export { SelectField } from './components/select';
export type { SelectFieldProps } from './components/select';

// Surfaces
export { Panel, PanelHeading, InkGrid, InkGridCell } from './components/panel';
export { PageHeader } from './components/page-header';
export type { PageHeaderProps } from './components/page-header';
export { FeatureCard } from './components/feature-card';
export { FaqItem } from './components/faq-item';
export { MetricCards } from './components/metric-cards';
export type { MetricCardData } from './components/metric-cards';

// Status
export { PriorityBadge, PRIORITIES } from './components/priority-badge';
export type { Priority, PriorityBadgeProps } from './components/priority-badge';
export { DegradedBanner } from './components/degraded-banner';

// Brand and chrome
export { Lockup } from './components/lockup';
export type { LockupProps } from './components/lockup';
export { EntitySwitcher } from './components/entity-switcher';

// Auth surfaces
export { CognitoBadge, AuthBanner, AuthFormError } from './components/auth-primitives';
