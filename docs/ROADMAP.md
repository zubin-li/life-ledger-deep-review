# Product roadmap

Life Ledger grows from one principle: reflection should stay useful without requiring an account, a subscription, or an AI provider. New capabilities must preserve the local-first experience and make private-data boundaries understandable before they add convenience.

This document describes direction, not a delivery promise. Focused GitHub issues hold the implementation decisions and acceptance criteria once work begins.

## Now: report foundation

### Print-ready weekly and monthly reports

Build one deterministic report model for a selected week or month, then render it as a calm, print-ready page that the browser can print or save as PDF.

The first report should be able to include:

- daily and periodic habit completion;
- a mood calendar and mood distribution;
- total focus time and focus time by topic;
- weekly goals and written output;
- monthly reflection;
- optional journal excerpts selected by the user.

The report must work locally, support English, Simplified Chinese, and German, and never mutate the source records. Private narrative fields remain opt-in. This report model is also the rendering foundation for future optional AI summaries.

## Shipped foundation: assisted daily reflection

### Voice daily reflection

The Cloudflare self-hosted edition now provides a deliberately narrow voice flow: record a check-in, transcribe it, refine it into faithful prose, review the editable draft, and append it to today's journal. Audio is never stored, and the model cannot alter habits, moods, or goals.

## Next: period reflection

### Privacy-preserving AI reflection

Explore an optional bring-your-own-key integration that turns an already aggregated period into a structured reflection. AI output should appear as an editable preview before it can be saved or exported through the standard report renderer.

Guardrails:

- no project-owned central AI account or bundled secret;
- users choose the provider and the data scope sent to it;
- API keys are excluded from synchronization and backups;
- source records are never silently rewritten;
- generated claims remain traceable to the selected period;
- the deterministic report remains fully useful without AI.

## Explore: context and media

### Photo attachments and portable backups

Photos require a storage and portability design before a visible attachment button becomes a complete feature. A future design should cover image resizing, metadata handling, browser quota feedback, IndexedDB or equivalent binary storage, object storage for self-hosted sync, and a backup archive that restores both records and media.

Social posters are a possible later output, not part of the first storage milestone.

### Optional weather context

Weather may add useful context to long-term mood and habit patterns, but it remains exploratory. Any implementation should be optional, minimize location precision, store the source and time zone with each daily snapshot, and begin with descriptive comparisons rather than predictive claims.

Machine-learning analysis is not planned until the product has enough trustworthy longitudinal data and a clear method for handling confounding factors such as sleep, workdays, travel, and exercise.

## Ongoing foundations

- Safer conflict handling for concurrent offline edits
- Optional monthly partitioning for very long journal histories
- Automated accessibility and browser regression coverage
- Community-contributed translations

## Non-goals

- Requiring AI for ordinary tracking or report export
- Sending journal history to a project-owned service
- Automatically applying inferred voice changes
- Promising reliable background report generation in a local-only PWA
- Storing large media payloads inside the current JSON state or D1 document
- Presenting correlation as medical or causal advice
