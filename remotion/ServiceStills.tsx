import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";

const colors = {
  ivory: "#f7f2ea",
  surface: "#fffdf8",
  charcoal: "#181614",
  charcoal2: "#211e1b",
  ink: "#161413",
  muted: "#6e6258",
  copper: "#b9825b",
  copperDeep: "#8f5c34",
  sage: "#9aa48c",
  line: "#e6ddd1",
  lineDark: "#35302b",
};

const serif: CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  letterSpacing: 0,
};

const canvas: CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  background: colors.ivory,
  color: colors.ink,
  overflow: "hidden",
};

const grain: CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0.13,
  backgroundImage:
    "radial-gradient(circle at 18% 24%, rgba(24,22,20,.58) 0 1px, transparent 1px), radial-gradient(circle at 76% 18%, rgba(24,22,20,.36) 0 1px, transparent 1px)",
  backgroundSize: "18px 18px, 26px 26px",
};

type ServiceFrameConfig = {
  number: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  kind:
    | "audit"
    | "training"
    | "automation"
    | "content"
    | "concierge"
    | "knowledge"
    | "packaging"
    | "support";
  dark?: boolean;
};

const frames = {
  audit: {
    number: "01",
    eyebrow: "diagnostic",
    title: "AI-аудит",
    subtitle: "process map / effort / risk",
    kind: "audit",
  },
  training: {
    number: "02",
    eyebrow: "team practice",
    title: "AI-обучение",
    subtitle: "shared prompts / review habits",
    kind: "training",
  },
  automation: {
    number: "03",
    eyebrow: "workflow build",
    title: "AI-автоматизация",
    subtitle: "requests / CRM / handoff",
    kind: "automation",
    dark: true,
  },
  content: {
    number: "04",
    eyebrow: "editorial system",
    title: "AI-контент",
    subtitle: "one idea / many formats",
    kind: "content",
  },
  concierge: {
    number: "05",
    eyebrow: "client front line",
    title: "AI-консьерж",
    subtitle: "FAQ / tone / human handoff",
    kind: "concierge",
    dark: true,
  },
  knowledge: {
    number: "06",
    eyebrow: "single source",
    title: "AI-база знаний",
    subtitle: "Notion / rules / access",
    kind: "knowledge",
  },
  packaging: {
    number: "07",
    eyebrow: "offer design",
    title: "AI-упаковка",
    subtitle: "positioning / page / materials",
    kind: "packaging",
  },
  support: {
    number: "08",
    eyebrow: "continuous loop",
    title: "AI-сопровождение",
    subtitle: "review / improve / onboard",
    kind: "support",
    dark: true,
  },
} satisfies Record<string, ServiceFrameConfig>;

function Pill({
  children,
  dark = false,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${dark ? colors.lineDark : colors.line}`,
        borderRadius: 999,
        padding: "10px 15px",
        color: dark ? "rgba(247,242,234,.72)" : colors.copperDeep,
        background: dark ? "rgba(255,253,248,.035)" : "rgba(255,253,248,.62)",
        fontSize: 18,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.11em",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MiniPanel({
  children,
  dark = false,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        border: `1px solid ${dark ? colors.lineDark : colors.line}`,
        borderRadius: 24,
        background: dark ? "rgba(255,253,248,.045)" : colors.surface,
        color: dark ? colors.ivory : colors.ink,
        boxShadow: dark ? "0 18px 44px rgba(0,0,0,.18)" : "0 18px 44px rgba(24,22,20,.10)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function FrameShell({ frame, children }: { frame: ServiceFrameConfig; children: ReactNode }) {
  const dark = Boolean(frame.dark);
  const foreground = dark ? colors.ivory : colors.ink;
  const secondary = dark ? "rgba(247,242,234,.64)" : colors.muted;
  const titleSize = frame.title.length > 13 ? 76 : 94;

  return (
    <AbsoluteFill style={{ ...canvas, background: dark ? colors.charcoal : colors.ivory }}>
      <div style={grain} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: dark
            ? "radial-gradient(circle at 82% 8%, rgba(185,130,91,.28), transparent 32%), radial-gradient(circle at 10% 20%, rgba(154,164,140,.16), transparent 34%)"
            : "radial-gradient(circle at 88% 0%, rgba(185,130,91,.24), transparent 34%), radial-gradient(circle at 10% 10%, rgba(154,164,140,.20), transparent 32%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 54,
          display: "grid",
          gridTemplateColumns: "0.92fr 1.08fr",
          gap: 44,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            borderTop: `2px solid ${dark ? colors.lineDark : colors.line}`,
            borderBottom: `2px solid ${dark ? colors.lineDark : colors.line}`,
            padding: "42px 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Pill dark={dark}>{frame.eyebrow}</Pill>
            <div
              style={{
                ...serif,
                marginTop: 44,
                color: foreground,
                fontSize: titleSize,
                lineHeight: 0.92,
                fontWeight: 600,
              }}
            >
              {frame.title}
            </div>
          </div>

          <div>
            <div style={{ color: colors.copper, fontSize: 52, fontWeight: 700, ...serif }}>
              {frame.number}
            </div>
            <div
              style={{
                marginTop: 18,
                maxWidth: 460,
                color: secondary,
                fontSize: 25,
                lineHeight: 1.28,
              }}
            >
              {frame.subtitle}
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            borderRadius: 34,
            overflow: "hidden",
            background: dark ? colors.charcoal2 : colors.surface,
            border: `2px solid ${dark ? colors.lineDark : colors.line}`,
            boxShadow: dark ? "0 34px 90px rgba(0,0,0,.32)" : "0 34px 90px rgba(24,22,20,.18)",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ConnectorSvg({ dark = false }: { dark?: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 660 560" style={{ position: "absolute", inset: 0 }}>
      <path
        d="M72 118 C188 118 204 256 320 270 C440 284 474 168 596 168"
        fill="none"
        stroke={colors.copper}
        strokeWidth="4"
        strokeDasharray="14 14"
        opacity={dark ? 0.65 : 0.52}
      />
      <path
        d="M86 420 C208 420 214 326 330 314 C456 300 488 424 590 424"
        fill="none"
        stroke={colors.sage}
        strokeWidth="4"
        strokeDasharray="14 14"
        opacity={dark ? 0.56 : 0.48}
      />
    </svg>
  );
}

function AuditScene() {
  return (
    <>
      <ConnectorSvg />
      <div style={{ position: "absolute", inset: 54 }}>
        <svg width="100%" height="100%" viewBox="0 0 650 520">
          {[86, 142, 198].map((radius) => (
            <circle
              key={radius}
              cx="326"
              cy="252"
              r={radius}
              fill="none"
              stroke={colors.line}
              strokeWidth="2"
            />
          ))}
          <circle cx="326" cy="252" r="62" fill={colors.charcoal} />
          <circle cx="326" cy="252" r="12" fill={colors.copper} />
          {[
            [134, 126, "FAQ"],
            [506, 158, "CRM"],
            [112, 382, "content"],
            [512, 390, "team"],
          ].map(([x, y, label]) => (
            <g key={label}>
              <circle cx={x} cy={y} r="34" fill={colors.surface} stroke={colors.line} strokeWidth="2" />
              <text x={x} y={Number(y) + 7} textAnchor="middle" fill={colors.muted} fontSize="19" fontWeight="700">
                {label}
              </text>
            </g>
          ))}
        </svg>

        <MiniPanel style={{ position: "absolute", right: 18, top: 24, width: 206, padding: 22 }}>
          <Pill style={{ fontSize: 14, padding: "7px 10px" }}>map</Pill>
          <div style={{ ...serif, marginTop: 18, fontSize: 31, fontWeight: 600 }}>3 candidates</div>
          <div style={{ marginTop: 8, color: colors.muted, fontSize: 17, lineHeight: 1.3 }}>
            what to test first
          </div>
        </MiniPanel>
      </div>
    </>
  );
}

function TrainingScene() {
  const cards = ["role", "prompt", "review"];
  const left = [26, 188, 344];
  return (
    <div style={{ position: "absolute", inset: 52 }}>
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 180,
          height: 120,
          borderRadius: 999,
          background: "linear-gradient(90deg, rgba(185,130,91,.16), rgba(154,164,140,.16))",
          border: `1px solid ${colors.line}`,
        }}
      />
      {cards.map((card, index) => (
        <MiniPanel
          key={card}
          style={{
            position: "absolute",
            left: left[index],
            top: 76 + (index % 2) * 124,
            width: 154,
            minHeight: 150,
            padding: 22,
            transform: `rotate(${index === 1 ? -2 : index === 2 ? 2 : -4}deg)`,
          }}
        >
          <div style={{ color: colors.copperDeep, fontSize: 20, fontWeight: 700 }}>0{index + 1}</div>
          <div style={{ ...serif, marginTop: 18, fontSize: 31, fontWeight: 600 }}>{card}</div>
          <div style={{ marginTop: 10, color: colors.muted, fontSize: 16 }}>team habit</div>
        </MiniPanel>
      ))}
      <MiniPanel style={{ position: "absolute", right: 20, bottom: 16, width: 260, padding: 24 }}>
        <div style={{ color: colors.copperDeep, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>
          same output
        </div>
        <div style={{ marginTop: 12, color: colors.muted, fontSize: 18, lineHeight: 1.3 }}>
          one instruction set for the whole team
        </div>
      </MiniPanel>
    </div>
  );
}

function AutomationScene() {
  const nodes = ["request", "rules", "draft", "CRM"];
  return (
    <div style={{ position: "absolute", inset: 54 }}>
      <svg width="100%" height="100%" viewBox="0 0 650 520" style={{ position: "absolute", inset: 0 }}>
        <path
          d="M318 88 V338"
          fill="none"
          stroke={colors.copper}
          strokeWidth="4"
          strokeDasharray="14 14"
          opacity="0.62"
        />
        <path
          d="M318 338 C318 392 386 392 438 392"
          fill="none"
          stroke={colors.sage}
          strokeWidth="4"
          strokeDasharray="14 14"
          opacity="0.52"
        />
      </svg>

      <div style={{ position: "absolute", left: 30, top: 32, display: "grid", gap: 22 }}>
        {nodes.map((node, index) => (
          <div
            key={node}
            style={{
              width: 318,
              border: `1px solid ${colors.lineDark}`,
              borderRadius: 999,
              padding: "18px 24px",
              color: "rgba(247,242,234,.78)",
              background: "rgba(255,253,248,.045)",
              fontSize: 28,
              fontWeight: 700,
              display: "grid",
              gridTemplateColumns: "48px 1fr",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ color: colors.copper, ...serif, fontSize: 27 }}>0{index + 1}</span>
            <span>{node}</span>
          </div>
        ))}
      </div>

      <MiniPanel dark style={{ position: "absolute", left: 48, bottom: 14, width: 318, padding: 24 }}>
        <div style={{ color: colors.copper, fontSize: 30, ...serif }}>human approval</div>
        <div style={{ marginTop: 10, color: "rgba(247,242,234,.58)", fontSize: 16, lineHeight: 1.3 }}>
          AI drafts. Person stays responsible.
        </div>
      </MiniPanel>
    </div>
  );
}

function ContentScene() {
  const pages = ["post", "email", "guide", "brief"];
  return (
    <div style={{ position: "absolute", inset: 48 }}>
      {pages.map((page, index) => (
        <MiniPanel
          key={page}
          style={{
            position: "absolute",
            left: 54 + index * 74,
            top: 70 + index * 38,
            width: 280,
            minHeight: 300,
            padding: 26,
            transform: `rotate(${[-5, -1, 2, 5][index]}deg)`,
          }}
        >
          <Pill style={{ fontSize: 14, padding: "7px 10px" }}>{page}</Pill>
          <div style={{ marginTop: 56, height: 10, width: 160, borderRadius: 999, background: colors.charcoal }} />
          <div style={{ marginTop: 18, height: 8, width: 210, borderRadius: 999, background: colors.line }} />
          <div style={{ marginTop: 12, height: 8, width: 190, borderRadius: 999, background: colors.line }} />
        </MiniPanel>
      ))}
      <div style={{ position: "absolute", right: 24, bottom: 28, color: colors.copperDeep, fontSize: 34, ...serif }}>
        one idea → many formats
      </div>
    </div>
  );
}

function ConciergeScene() {
  const bubbles = ["price?", "booking", "prep", "human"];
  return (
    <div style={{ position: "absolute", inset: 52 }}>
      <ConnectorSvg dark />
      <MiniPanel dark style={{ position: "absolute", left: 22, top: 22, width: 250, padding: 26 }}>
        <div style={{ ...serif, color: colors.ivory, fontSize: 42 }}>Client front</div>
        <div style={{ marginTop: 10, color: "rgba(247,242,234,.58)", fontSize: 18 }}>fast replies, clear limits</div>
      </MiniPanel>
      {bubbles.map((bubble, index) => (
        <div
          key={bubble}
          style={{
            position: "absolute",
            right: index % 2 ? 38 : 130,
            top: 72 + index * 92,
            border: `1px solid ${index === 3 ? colors.copper : colors.lineDark}`,
            borderRadius: 26,
            padding: "18px 24px",
            minWidth: 178,
            color: index === 3 ? colors.charcoal : colors.ivory,
            background: index === 3 ? colors.copper : "rgba(255,253,248,.055)",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {bubble}
        </div>
      ))}
    </div>
  );
}

function KnowledgeScene() {
  const rows = ["policy", "FAQ", "tone", "process"];
  return (
    <div style={{ position: "absolute", inset: 52 }}>
      <MiniPanel style={{ height: "100%", padding: 34, background: colors.charcoal, color: colors.ivory, borderColor: colors.lineDark }}>
        <div style={{ color: colors.copper, fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".11em" }}>
          source of truth
        </div>
        <div style={{ ...serif, marginTop: 16, fontSize: 48, fontWeight: 600 }}>Knowledge base</div>
        <div style={{ marginTop: 44, display: "grid", gap: 18 }}>
          {rows.map((row, index) => (
            <div key={row} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 18, alignItems: "center" }}>
              <div style={{ color: colors.copper, fontSize: 28, ...serif }}>0{index + 1}</div>
              <div style={{ borderBottom: `1px solid ${colors.lineDark}`, paddingBottom: 16 }}>
                <div style={{ color: colors.ivory, fontSize: 25, fontWeight: 700 }}>{row}</div>
              </div>
            </div>
          ))}
        </div>
      </MiniPanel>
    </div>
  );
}

function PackagingScene() {
  const levels = ["offer", "proof", "page"];
  const left = [62, 216, 352];
  return (
    <div style={{ position: "absolute", inset: 54 }}>
      <svg width="100%" height="100%" viewBox="0 0 650 520" style={{ position: "absolute", inset: 0 }}>
        <path d="M325 58 L568 446 H82 Z" fill={colors.surface} stroke={colors.line} strokeWidth="2" />
        <path d="M188 282 H462" stroke={colors.line} strokeWidth="2" />
        <path d="M246 188 H404" stroke={colors.line} strokeWidth="2" />
        <circle cx="325" cy="126" r="16" fill={colors.copper} />
        <circle cx="325" cy="238" r="16" fill={colors.sage} />
        <circle cx="325" cy="364" r="16" fill={colors.copperDeep} />
      </svg>
      {levels.map((level, index) => (
        <MiniPanel
          key={level}
          style={{
            position: "absolute",
            left: left[index],
            bottom: 28 + index * 72,
            width: 150,
            padding: 20,
          }}
        >
          <div style={{ color: colors.copperDeep, fontSize: 18, fontWeight: 700 }}>0{index + 1}</div>
          <div style={{ ...serif, marginTop: 10, fontSize: 30, fontWeight: 600 }}>{level}</div>
        </MiniPanel>
      ))}
    </div>
  );
}

function SupportScene() {
  return (
    <div style={{ position: "absolute", inset: 52 }}>
      <svg width="100%" height="100%" viewBox="0 0 650 520">
        <path
          d="M180 150 C250 70 402 76 474 160 C550 248 520 392 414 438 C310 484 182 438 140 330"
          fill="none"
          stroke={colors.copper}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="24 22"
        />
        <path d="M142 330 L108 318 L126 378 Z" fill={colors.copper} />
        <circle cx="326" cy="260" r="92" fill="rgba(255,253,248,.055)" stroke={colors.lineDark} strokeWidth="2" />
        <circle cx="326" cy="260" r="18" fill={colors.copper} />
      </svg>
      <MiniPanel dark style={{ position: "absolute", left: 20, bottom: 24, width: 306, padding: 24 }}>
        <div style={{ ...serif, color: colors.ivory, fontSize: 34 }}>review loop</div>
        <div style={{ marginTop: 10, color: "rgba(247,242,234,.58)", fontSize: 17, lineHeight: 1.3 }}>
          test, adjust, onboard
        </div>
      </MiniPanel>
    </div>
  );
}

function ServiceFrame({ frame }: { frame: ServiceFrameConfig }) {
  return (
    <FrameShell frame={frame}>
      {frame.kind === "audit" ? <AuditScene /> : null}
      {frame.kind === "training" ? <TrainingScene /> : null}
      {frame.kind === "automation" ? <AutomationScene /> : null}
      {frame.kind === "content" ? <ContentScene /> : null}
      {frame.kind === "concierge" ? <ConciergeScene /> : null}
      {frame.kind === "knowledge" ? <KnowledgeScene /> : null}
      {frame.kind === "packaging" ? <PackagingScene /> : null}
      {frame.kind === "support" ? <SupportScene /> : null}
    </FrameShell>
  );
}

export function AuditServiceFrame() {
  return <ServiceFrame frame={frames.audit} />;
}

export function TrainingServiceFrame() {
  return <ServiceFrame frame={frames.training} />;
}

export function AutomationServiceFrame() {
  return <ServiceFrame frame={frames.automation} />;
}

export function ContentServiceFrame() {
  return <ServiceFrame frame={frames.content} />;
}

export function ConciergeServiceFrame() {
  return <ServiceFrame frame={frames.concierge} />;
}

export function KnowledgeServiceFrame() {
  return <ServiceFrame frame={frames.knowledge} />;
}

export function PackagingServiceFrame() {
  return <ServiceFrame frame={frames.packaging} />;
}

export function SupportServiceFrame() {
  return <ServiceFrame frame={frames.support} />;
}
