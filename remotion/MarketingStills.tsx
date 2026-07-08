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

const canvas: CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  background: colors.ivory,
  color: colors.ink,
  overflow: "hidden",
};

const serif: CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  letterSpacing: 0,
};

const grain: CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0.14,
  backgroundImage:
    "radial-gradient(circle at 18% 24%, rgba(24,22,20,.7) 0 1px, transparent 1px), radial-gradient(circle at 76% 18%, rgba(24,22,20,.42) 0 1px, transparent 1px)",
  backgroundSize: "18px 18px, 25px 25px",
};

function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: `1px solid ${dark ? colors.lineDark : colors.line}`,
        borderRadius: 999,
        padding: "10px 16px",
        color: dark ? "rgba(247,242,234,.76)" : colors.copperDeep,
        fontSize: 20,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
      }}
    >
      {children}
    </div>
  );
}

export function SelenaSystemsProcessVisual() {
  const signals = ["inbox", "FAQ", "CRM", "content", "team"];
  const outputs = ["AI map", "automation", "playbook"];

  return (
    <AbsoluteFill style={canvas}>
      <div style={grain} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 88% 10%, rgba(185,130,91,.26), transparent 34%), radial-gradient(circle at 10% 12%, rgba(154,164,140,.25), transparent 32%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 92,
          top: 78,
          right: 92,
          bottom: 78,
          display: "grid",
          gridTemplateColumns: "0.86fr 1.14fr",
          gap: 54,
        }}
      >
        <div
          style={{
            borderTop: `2px solid ${colors.line}`,
            borderBottom: `2px solid ${colors.line}`,
            padding: "54px 0",
          }}
        >
          <Label>Selena Systems process</Label>
          <h1
            style={{
              ...serif,
              margin: "54px 0 0",
              fontSize: 102,
              lineHeight: 0.94,
              fontWeight: 600,
              maxWidth: 590,
            }}
          >
            From noisy work to one AI scenario.
          </h1>
          <p
            style={{
              margin: "38px 0 0",
              maxWidth: 540,
              color: colors.muted,
              fontSize: 31,
              lineHeight: 1.34,
            }}
          >
            We map the process before choosing tools. AI supports the routine;
            people keep judgment.
          </p>
        </div>

        <div
          style={{
            position: "relative",
            borderRadius: 32,
            background: colors.charcoal,
            boxShadow: "0 34px 90px rgba(24,22,20,.28)",
            padding: 44,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,253,248,.06), transparent 48%), radial-gradient(circle at 76% 12%, rgba(185,130,91,.24), transparent 30%)",
            }}
          />
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 760 780"
            style={{ position: "absolute", inset: 0 }}
          >
            <path
              d="M126 188 C272 188 282 386 360 396 C508 414 564 284 646 284"
              fill="none"
              stroke={colors.copper}
              strokeWidth="5"
              strokeDasharray="16 16"
              opacity="0.68"
            />
            <path
              d="M126 564 C274 564 292 434 360 424 C510 402 566 520 646 520"
              fill="none"
              stroke={colors.sage}
              strokeWidth="5"
              strokeDasharray="16 16"
              opacity="0.58"
            />
            <circle cx="360" cy="410" r="72" fill="#fffdf8" opacity="0.95" />
            <circle cx="360" cy="410" r="98" fill="none" stroke={colors.lineDark} strokeWidth="2" />
          </svg>

          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
            <div style={{ display: "grid", gap: 20 }}>
              <Label dark>inputs</Label>
              {signals.map((signal, index) => (
                <div
                  key={signal}
                  style={{
                    marginLeft: index % 2 ? 34 : 0,
                    width: 220,
                    border: `1px solid ${colors.lineDark}`,
                    borderRadius: 999,
                    padding: "16px 22px",
                    color: "rgba(247,242,234,.72)",
                    background: "rgba(255,253,248,.035)",
                    fontSize: 27,
                    transform: `rotate(${index % 2 ? 1.6 : -1.1}deg)`,
                  }}
                >
                  {signal}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", justifyItems: "end", gap: 24 }}>
              <Label dark>outputs</Label>
              {outputs.map((output, index) => (
                <div
                  key={output}
                  style={{
                    width: 304,
                    minHeight: 138,
                    borderRadius: 24,
                    background: colors.surface,
                    border: `2px solid ${colors.line}`,
                    padding: 24,
                    color: colors.ink,
                    boxShadow: "0 18px 44px rgba(0,0,0,.18)",
                  }}
                >
                  <div style={{ color: colors.copperDeep, fontSize: 22, fontWeight: 700 }}>
                    0{index + 1}
                  </div>
                  <div style={{ ...serif, marginTop: 18, fontSize: 40, fontWeight: 600 }}>
                    {output}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AbsoluteFill>
  );
}

export function SelenaSystemsLibraryVisual() {
  const rows = ["AI opportunity map", "Client replies checklist", "Content engine brief", "Team prompt rules"];

  return (
    <AbsoluteFill style={canvas}>
      <div style={grain} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 14% 10%, rgba(154,164,140,.24), transparent 34%), radial-gradient(circle at 92% 16%, rgba(185,130,91,.24), transparent 34%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 72,
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: 54,
          alignItems: "center",
        }}
      >
        <div>
          <Label>lead library</Label>
          <h2 style={{ ...serif, margin: "42px 0 0", fontSize: 88, lineHeight: 0.96, fontWeight: 600 }}>
            Start with a map. Build the library next.
          </h2>
          <p style={{ marginTop: 34, color: colors.muted, fontSize: 29, lineHeight: 1.32 }}>
            A calm sequence of playbooks, lead magnets and operating rules for
            AI adoption.
          </p>
        </div>

        <div style={{ position: "relative", height: 780 }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                left: 42 + index * 44,
                top: 58 + index * 42,
                width: 636,
                height: 548,
                borderRadius: 30,
                background: index === 2 ? colors.charcoal : colors.surface,
                border: `2px solid ${index === 2 ? colors.lineDark : colors.line}`,
                boxShadow: "0 24px 70px rgba(24,22,20,.18)",
                transform: `rotate(${index === 0 ? -5 : index === 1 ? -1.5 : 2.2}deg)`,
              }}
            />
          ))}

          <div
            style={{
              position: "absolute",
              left: 150,
              top: 158,
              width: 620,
              minHeight: 562,
              borderRadius: 34,
              background: colors.charcoal,
              border: `2px solid ${colors.lineDark}`,
              color: colors.ivory,
              padding: 42,
              boxShadow: "0 34px 90px rgba(24,22,20,.30)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: colors.copper, fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".14em" }}>
                  Selena Systems archive
                </div>
                <div style={{ ...serif, marginTop: 14, fontSize: 56, fontWeight: 600 }}>
                  AI playbooks
                </div>
              </div>
              <div
                style={{
                  border: `1px solid ${colors.lineDark}`,
                  borderRadius: 999,
                  padding: "10px 16px",
                  color: "rgba(247,242,234,.6)",
                  fontSize: 19,
                }}
              >
                waitlist
              </div>
            </div>

            <div style={{ marginTop: 54, display: "grid", gap: 24 }}>
              {rows.map((row, index) => (
                <div key={row} style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 20, alignItems: "center" }}>
                  <div style={{ ...serif, color: colors.copper, fontSize: 36 }}>0{index + 1}</div>
                  <div style={{ borderBottom: `1px solid ${colors.lineDark}`, paddingBottom: 18 }}>
                    <div style={{ fontSize: 27, fontWeight: 700 }}>{row}</div>
                    <div style={{ marginTop: 8, color: "rgba(247,242,234,.54)", fontSize: 18 }}>
                      diagnostic asset
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
