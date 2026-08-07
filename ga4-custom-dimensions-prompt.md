# GA4 Custom Dimensions — Setup Prompt

Hand this file to Claude in Chrome (or follow it manually) to register the
custom dimensions that the site's event instrumentation depends on.

**Run this before deploying the instrumentation.** Custom dimensions are not
retroactive — any events that arrive before the dimensions exist will lose
their parameter values permanently.

---

You are registering custom dimensions in Google Analytics 4. Work carefully and
do not modify anything outside the scope described here.

## Target property — verify before making any change

- Google Analytics account: **frasermarlow.com**
- Property name: **middle-earth-interactive-map**
- Property ID: **524060174**

This account contains other properties (`frasermarlow.com - GA4`,
`ale-house-hobgoblins`). Changes to the wrong property are the main risk in this
task. Confirm the property selector reads `middle-earth-interactive-map` before
creating anything. If it does not, switch properties first.

## Background

A website has just been instrumented with custom GA4 events. The event names
arrive in GA4 automatically, but their parameters will not appear in reports
until each is registered as a custom dimension. Without this, we can see that
`marker_open` fired 4,000 times but not which map locations were opened.

The events being sent, and the parameters each carries:

| Event | Parameters |
|---|---|
| `marker_open` | `me_event`, `category` |
| `legend_event_click` | `me_event`, `category` |
| `journey_toggle` | `journey`, `state` |
| `category_toggle` | `category`, `state` |
| `satellite_toggle` | `state`, `source` |
| `measure_toggle` | `state` |
| `coords_toggle` | `state` |
| `deep_link_arrival` | `me_event` |
| `splash_shown`, `splash_dismissed`, `info_opened` | (none) |
| `timeline_play`, `timeline_pause` | (none) |
| `timeline_speed_change` | `speed_ms` |
| `timeline_filter` | `category`, `state` |
| `read_more` | `me_event`, `state` |
| `related_events_opened` | `me_event` |
| `related_link_followed` | `me_event` |
| `view_on_map` | `me_event` |

That resolves to six unique parameters needing registration.

## Steps

1. Navigate to:
   `https://analytics.google.com/analytics/web/#/p524060174/admin/customdefinitions/hub`

   If that does not land on Custom definitions, navigate manually: **Admin**
   (gear icon, bottom-left) → confirm the property is
   `middle-earth-interactive-map` → **Data display** → **Custom definitions**.

2. Select the **Custom dimensions** tab and read the existing list. Some may
   already exist.

3. For each row in the table below whose **Event parameter** is not already
   present, click **Create custom dimension** and fill in the three fields
   exactly as given. Scope is **Event** for all six.

| Dimension name | Scope | Event parameter | Description |
|---|---|---|---|
| Middle-earth Event | Event | `me_event` | Name of the Middle-earth location or event the user interacted with (e.g. "Cuiviénen — Awakening of the Elves"). Deliberately not named `event_name`, to avoid shadowing GA4's built-in Event name dimension. |
| Book Category | Event | `category` | Source book/category of the event: silmarillion, hobbit, fellowship, towers, king, appendix. |
| Journey | Event | `journey` | Label of the character journey path toggled on the map (e.g. "The Fellowship"). |
| Toggle State | Event | `state` | Whether a toggle was switched on or off; also expanded/collapsed for read_more. |
| Satellite Source | Event | `source` | How satellite view was activated: `legend` (user clicked the toggle) or `deep_link` (arrived via ?view=satellite). |
| Timeline Speed (ms) | Event | `speed_ms` | Playback interval in milliseconds chosen in timeline play mode. |

4. Save each one. Parameter names are **case-sensitive** — enter them exactly as
   written, with no leading or trailing spaces.

5. Verify: the Custom dimensions tab should now list all six, each with scope
   "Event" and the parameter name matching the table.

## Constraints

- Scope must be **Event** for all six. Do not use User or Item scope.
- Do **not** create custom metrics — dimensions only. (`speed_ms` is numeric but
  we want to break traffic down by which speed was chosen, which needs a
  dimension.)
- Do **not** edit, archive, or delete any existing custom definition.
- If GA4 rejects a parameter name as reserved, invalid, or duplicate, **stop and
  report it** rather than substituting a different name — the name must match
  what the website code sends or no data will be joined.
- If the property already has close to 50 event-scoped custom dimensions (the
  free-tier quota), stop and report before creating more.

## Report back

- Which dimensions you created
- Which already existed and were skipped
- Any that failed, with the exact error text
- The total count of event-scoped custom dimensions now in use, out of the
  50 quota

---

## After running

- Populated values typically take 24–48 hours to appear in standard reports.
  DebugView shows them immediately if you need to confirm sooner.
- The parameter names above must stay in sync with the `track()` calls in
  `index.html` and `timeline.html`. Renaming one without the other silently
  breaks the join.
