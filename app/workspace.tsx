"use client";

import { useMemo, useState } from "react";
import type { ChatGPTUser } from "./chatgpt-auth";

type ConnectorId = "mail" | "tasks" | "calendar";

type Connector = {
  id: ConnectorId;
  label: string;
  provider: string;
  scope: string;
  cadence: string;
  signal: string;
};

type Priority = {
  title: string;
  source: string;
  due: string;
  effort: number;
  impact: "High" | "Medium";
  status: "Focus" | "At risk" | "Waiting";
};

type WindowBlock = {
  label: string;
  time: string;
  load: number;
};

const connectors: Connector[] = [
  {
    id: "mail",
    label: "Email",
    provider: "Microsoft 365 or Gmail",
    scope: "Inbox, sent items, labels",
    cadence: "Scans every morning",
    signal: "17 commitments found",
  },
  {
    id: "tasks",
    label: "Tasks",
    provider: "Planner, To Do, Jira, Linear",
    scope: "Open tasks and owner fields",
    cadence: "Refreshes every 20 minutes",
    signal: "23 active tasks mapped",
  },
  {
    id: "calendar",
    label: "Calendar",
    provider: "Outlook or Google Calendar",
    scope: "Events, travel buffers, focus holds",
    cadence: "Forecasts the next 10 workdays",
    signal: "31.5 hours available",
  },
];

const priorities: Priority[] = [
  {
    title: "Finalize executive readout for Thursday steering review",
    source: "Calendar, email thread, task owner",
    due: "Today, 4:00 PM",
    effort: 3.5,
    impact: "High",
    status: "Focus",
  },
  {
    title: "Resolve procurement follow-up before vendor lock window",
    source: "Email commitment",
    due: "Tomorrow, 11:00 AM",
    effort: 2,
    impact: "High",
    status: "At risk",
  },
  {
    title: "Review revised launch checklist and assign blockers",
    source: "Task board",
    due: "Friday",
    effort: 1.5,
    impact: "Medium",
    status: "Waiting",
  },
];

const capacityWindows: WindowBlock[] = [
  { label: "Deep work", time: "9:30 AM - 11:15 AM", load: 78 },
  { label: "Decision queue", time: "1:00 PM - 2:20 PM", load: 64 },
  { label: "Follow-ups", time: "3:15 PM - 4:45 PM", load: 88 },
];

const commitments = [
  "Move procurement answer ahead of slide cleanup.",
  "Decline any same-day request above 90 minutes unless it replaces a lower-impact item.",
  "Protect the 9:30 AM focus block from meeting churn.",
];

function chatGPTSignInPath(returnTo: string): string {
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`;
}

function chatGPTSignOutPath(returnTo: string): string {
  return `/signout-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`;
}

export function OpsAgendaDashboard({ user }: { user: ChatGPTUser | null }) {
  const [connected, setConnected] = useState<Record<ConnectorId, boolean>>({
    mail: true,
    tasks: true,
    calendar: false,
  });
  const [newTaskEffort, setNewTaskEffort] = useState(2);
  const [newTaskUrgency, setNewTaskUrgency] = useState<"low" | "medium" | "high">(
    "medium",
  );

  const connectedCount = Object.values(connected).filter(Boolean).length;
  const baselineLoad = connectedCount === 3 ? 78 : connectedCount === 2 ? 71 : 58;
  const urgencyWeight =
    newTaskUrgency === "high" ? 14 : newTaskUrgency === "medium" ? 7 : 3;
  const projectedLoad = Math.min(100, baselineLoad + newTaskEffort * 4 + urgencyWeight);
  const openCapacity = Math.max(0, 100 - projectedLoad);
  const userName = user?.fullName ?? user?.displayName ?? "Ops lead";

  const capacityLabel = useMemo(() => {
    if (projectedLoad >= 92) return "Over capacity";
    if (projectedLoad >= 82) return "Tight";
    return "Acceptable";
  }, [projectedLoad]);

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Account and workspace">
        <div>
          <p className="eyebrow">Ops Agenda</p>
          <h1>Daily priority command center</h1>
        </div>
        <div className="account-panel">
          <span className={`auth-dot ${user ? "is-live" : ""}`} />
          <div>
            <strong>{user ? userName : "Demo workspace"}</strong>
            <span>{user ? user.email : "Sign in to use a private workspace"}</span>
          </div>
          {user ? (
            <a href={chatGPTSignOutPath("/")} className="ghost-button">
              Sign out
            </a>
          ) : (
            <a href={chatGPTSignInPath("/")} className="primary-button">
              Sign in
            </a>
          )}
        </div>
      </section>

      <section className="hero-grid" aria-label="Daily analysis">
        <div className="briefing-panel">
          <div className="briefing-header">
            <div>
              <p className="eyebrow">Today</p>
              <h2>Three moves protect the deadline slate.</h2>
            </div>
            <span className="score-chip">{baselineLoad}% planned</span>
          </div>
          <div className="priority-list">
            {priorities.map((priority) => (
              <article className="priority-item" key={priority.title}>
                <div>
                  <span className={`status-pill ${priority.status.toLowerCase().replace(" ", "-")}`}>
                    {priority.status}
                  </span>
                  <h3>{priority.title}</h3>
                  <p>{priority.source}</p>
                </div>
                <div className="priority-metrics">
                  <strong>{priority.due}</strong>
                  <span>{priority.effort}h effort</span>
                  <span>{priority.impact} impact</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="capacity-card" aria-label="Capacity forecast">
          <p className="eyebrow">Capacity</p>
          <div className="capacity-meter" aria-label={`${projectedLoad} percent projected load`}>
            <span style={{ width: `${projectedLoad}%` }} />
          </div>
          <div className="capacity-number">
            <strong>{capacityLabel}</strong>
            <span>{openCapacity}% flexible room</span>
          </div>
          <div className="new-task-control">
            <label htmlFor="task-effort">New task size</label>
            <input
              id="task-effort"
              type="range"
              min="1"
              max="6"
              value={newTaskEffort}
              onChange={(event) => setNewTaskEffort(Number(event.target.value))}
            />
            <div className="range-readout">{newTaskEffort} hours</div>
          </div>
          <div className="segmented" aria-label="New task urgency">
            {(["low", "medium", "high"] as const).map((urgency) => (
              <button
                key={urgency}
                type="button"
                className={newTaskUrgency === urgency ? "active" : ""}
                onClick={() => setNewTaskUrgency(urgency)}
              >
                {urgency}
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="lower-grid">
        <div className="connectors-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Connections</p>
              <h2>Work signals</h2>
            </div>
            <span>{connectedCount}/3 live</span>
          </div>
          <div className="connector-list">
            {connectors.map((connector) => (
              <article className="connector-card" key={connector.id}>
                <div className="connector-topline">
                  <div className="connector-icon" aria-hidden="true">
                    {connector.label.slice(0, 1)}
                  </div>
                  <div>
                    <h3>{connector.label}</h3>
                    <p>{connector.provider}</p>
                  </div>
                  <button
                    type="button"
                    className={connected[connector.id] ? "connected-button" : "connect-button"}
                    onClick={() =>
                      setConnected((current) => ({
                        ...current,
                        [connector.id]: !current[connector.id],
                      }))
                    }
                  >
                    {connected[connector.id] ? "Connected" : "Connect"}
                  </button>
                </div>
                <dl>
                  <div>
                    <dt>Scope</dt>
                    <dd>{connector.scope}</dd>
                  </div>
                  <div>
                    <dt>Cadence</dt>
                    <dd>{connector.cadence}</dd>
                  </div>
                  <div>
                    <dt>Signal</dt>
                    <dd>{connected[connector.id] ? connector.signal : "Not available"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>

        <aside className="right-rail">
          <section className="timeline-panel" aria-label="Protected work windows">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Schedule</p>
                <h2>Protected windows</h2>
              </div>
            </div>
            {capacityWindows.map((window) => (
              <div className="window-row" key={window.label}>
                <div>
                  <strong>{window.label}</strong>
                  <span>{window.time}</span>
                </div>
                <meter min="0" max="100" value={window.load}>
                  {window.load}%
                </meter>
              </div>
            ))}
          </section>

          <section className="decision-panel" aria-label="Daily recommendations">
            <p className="eyebrow">Recommendation</p>
            <h2>Capacity response</h2>
            <ul>
              {commitments.map((commitment) => (
                <li key={commitment}>{commitment}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
