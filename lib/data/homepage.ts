export type ProofProject = {
  name: string;
  url: string;
  category: string;
  text: string;
  /** Which operating-system layers this project exercises — mirrors the Systems section. */
  layers: string[];
  /**
   * Honesty rule: only ship a metric when it is real.
   * value — the number or artifact ("−18 h/week of manual work", "3 AI flows in production").
   * basis — period + how it was measured ("Apr–Jun 2026 · from intake logs").
   * Leave null until Selena supplies verified data — the card renders fine without it.
   */
  metric: { value: string; basis: string } | null;
};

export type TrackerStep = {
  title: string;
  text: string;
  status: "done" | "active" | "next";
};

export const homepage = {
  nav: [
    { label: "Problems", href: "/#problems" },
    { label: "Systems", href: "/#systems" },
    { label: "Sprint", href: "/#sprint" },
    { label: "Visibility", href: "/visibility" },
    { label: "Proof", href: "/#proof" },
    { label: "Packages", href: "/#packages" },
  ],
  cta: { label: "Book AI Audit", href: "/en/contact" },
  visual: {
    stages: ["Lead intake", "Workflow rules", "Human review"],
    layers: ["Sales", "Content", "Operations"],
    layerLabel: "connected layer",
    alt: "Selena Systems process visual: noisy work becomes one AI scenario.",
  },
  hero: {
    eyebrow: "AI-powered operating systems for growing businesses",
    headline: "Build the AI operating system your business keeps running manually.",
    subheadline:
      "Selena Systems designs and builds AI systems for sales, content, operations, documents, customer communication and internal workflows - without turning your business into a tool experiment.",
    primaryCta: { label: "Run Free Visibility Check", href: "/check" },
    trustLine:
      "Built for founders, agencies, hospitality teams, clinics, real estate operators, service companies and online businesses with revenue, momentum and too much manual work.",
    stats: [
      { value: "7 days", label: "focused AI Systems Sprint" },
      { value: "5 layers", label: "sales, ops, knowledge, content, automation" },
      { value: "1 OS", label: "clear handover your team can use" },
    ],
  },
  problems: {
    eyebrow: "The drag on growth",
    headline: "Revenue is moving, but the system behind it is still manual.",
    intro:
      "The issue is rarely one missing app. It is the daily leakage between leads, messages, documents, content, team memory and follow-up.",
    items: [
      {
        title: "Scattered leads",
        text: "Forms, DMs, WhatsApp, email. Five inboxes — no single next step.",
      },
      {
        title: "Manual customer communication",
        text: "The same answers, typed from scratch, every single day.",
      },
      {
        title: "Slow content production",
        text: "Every post, email and brief waits on one overloaded person.",
      },
      {
        title: "Overloaded team",
        text: "People move information between tools instead of moving the business.",
      },
      {
        title: "Knowledge spread across tools",
        text: "SOPs, offers and scripts live in chats, drives — and someone's head.",
      },
    ],
  },
  solution: {
    eyebrow: "What we build",
    headline: "A business operating layer, not another disconnected AI tool.",
    intro:
      "Each system is designed around the workflows that already create revenue, then AI is added where it reduces friction and keeps human approval in the right places.",
    systems: [
      {
        name: "AI Sales",
        text: "Lead intake, qualification, follow-up prompts, proposal drafts and CRM-ready summaries.",
      },
      {
        name: "AI Operations",
        text: "Internal workflows, admin handoffs, repeatable checklists and decision paths for daily execution.",
      },
      {
        name: "AI Knowledge Base",
        text: "A structured source of truth for policies, SOPs, offers, scripts, documents and team guidance.",
      },
      {
        name: "AI Content",
        text: "Content systems that turn expertise into posts, email, landing copy, briefs and campaign material.",
      },
      {
        name: "AI Automation",
        text: "No-code workflows across forms, CRM, spreadsheets, docs, messaging tools and internal notifications.",
      },
    ],
  },
  sprint: {
    eyebrow: "Main offer",
    headline: "7-Day AI Systems Sprint",
    intro:
      "A focused build sprint for founders who want a working AI operating layer quickly: mapped, designed, built, tested and handed over with clear rules.",
    deliverables: [
      "AI systems audit and workflow map",
      "Priority automation plan",
      "Sales, operations, content or knowledge-base system design",
      "Working no-code automations or AI-assisted workflows",
      "Prompt library and operating rules",
      "Handover documentation for the founder and team",
    ],
  },
  process: [
    {
      day: "Day 1",
      title: "Audit",
      text: "We map current workflows, tools, bottlenecks and the highest-leverage manual work.",
    },
    {
      day: "Day 2",
      title: "System Design",
      text: "We define the AI operating layer, approval rules, data flow and first build scope.",
    },
    {
      day: "Days 3-5",
      title: "Build",
      text: "We assemble automations, prompts, knowledge structures, intake flows and working handoffs.",
    },
    {
      day: "Day 6",
      title: "Test",
      text: "We test edge cases, tone, outputs, broken paths and human-review checkpoints.",
    },
    {
      day: "Day 7",
      title: "Handover",
      text: "You receive the workflow, documentation, operating rules and next-step recommendations.",
    },
  ],
  processIntro: {
    eyebrow: "How the sprint works",
    headline: "Seven days from scattered workflow to working operating layer.",
  },
  tracker: {
    eyebrow: "During the sprint",
    headline: "You watch the build move. Day by day, not in a weekly email.",
    demoLabel: "Demo view — this is what a client sees mid-sprint",
    dayLabel: "Day 3 of 7",
    stageLabel: "Build in progress",
    note: "Every sprint runs with a shared tracker: what is done, what is being built right now and what comes next — visible to you the whole time.",
    steps: [
      {
        title: "Audit",
        text: "Workflow mapped, bottlenecks named.",
        status: "done",
      },
      {
        title: "System design",
        text: "Operating layer and approval rules agreed.",
        status: "done",
      },
      {
        title: "Build",
        text: "Automations, prompts and intake flows being assembled.",
        status: "active",
      },
      {
        title: "Test",
        text: "Edge cases, tone and broken paths.",
        status: "next",
      },
      {
        title: "Handover",
        text: "Documentation and operating rules.",
        status: "next",
      },
    ] as TrackerStep[],
  },
  packagesIntro: {
    eyebrow: "Packages",
    headline: "Choose the right depth for the amount of manual work you want to remove.",
    featuredLabel: "Main",
  },
  packages: [
    {
      name: "AI Audit",
      price: "$500",
      description: "A focused diagnostic for founders who need clarity before building.",
      included: [
        "Workflow review",
        "AI opportunity map",
        "Priority recommendations",
        "Credited in full toward a Sprint or Business OS started within 30 days",
      ],
      featured: false,
    },
    {
      name: "AI Sprint",
      price: "$4,500",
      description: "The 7-day build sprint for one priority operating system layer.",
      included: ["System design", "Working build", "Handover docs"],
      featured: true,
    },
    {
      name: "AI Business OS",
      price: "from $10,000",
      description: "A broader operating system across sales, operations, knowledge and automation.",
      included: ["Multi-system architecture", "Implementation roadmap", "Team operating layer"],
      featured: false,
    },
  ],
  strategyCall: {
    title: "Mini-audit · 60-min Zoom + memo",
    price: "$100",
    text: "Not ready for the full audit? Exactly one hour on Zoom, focused on your process — and based on that conversation, a short written memo: what I saw and the first moves you can make. Credited in full toward the AI Audit within 30 days.",
    ctaLabel: "Book a mini-audit",
  },
  proof: {
    eyebrow: "Proof of operating range",
    headline: "Systems thinking across hospitality, care, service and online operations.",
    founderLine: "Founded and led by Selena — Founder & AI Systems Architect. Every system here is designed and built hands-on, not outsourced.",
    projects: [
      {
        name: "KORA Food Hall",
        url: "https://korafoodhall.com",
        category: "Hospitality operations",
        text: "Menu, vendor, customer communication and local operations workflows shaped into a clearer operating model.",
        layers: ["AI Sales", "AI Operations", "AI Content"],
        metric: {
          value: "3 AI flows in production",
          basis: "tenant outreach · content · daily ops digest — own venue, built hands-on",
        },
      },
      {
        name: "PetID.care",
        url: "https://petid.care",
        category: "Care and service infrastructure",
        text: "Customer, pet profile and support workflows organized around trust, data and repeatable assistance.",
        layers: ["AI Knowledge Base", "AI Operations"],
        // TODO(Selena): metric = { value: "…", basis: "period · how it was measured" }
        metric: null,
      },
      {
        name: "Doki.help",
        url: "https://doki.help",
        category: "Documents and support",
        text: "Document-heavy processes translated into clearer guidance, intake and customer-facing support paths.",
        layers: ["AI Knowledge Base", "AI Automation"],
        // TODO(Selena): metric = { value: "…", basis: "period · how it was measured" }
        metric: null,
      },
      {
        name: "remhaos.com",
        url: "https://remhaos.com",
        category: "Real estate and interiors",
        text: "An AI-assisted presales flow for interior designers: project intake, risk review, pricing context and proposal preparation.",
        layers: ["AI Sales", "AI Automation"],
        // TODO(Selena): metric = { value: "…", basis: "period · how it was measured" }
        metric: null,
      },
      {
        name: "otherbali.com",
        url: "https://otherbali.com",
        category: "Travel media and guides",
        text: "A Bali guide and media platform: places, guides and recommendations organized so visitors and residents find the right answer quickly.",
        layers: ["AI Content", "AI Knowledge Base"],
        // TODO(Selena): metric = { value: "…", basis: "period · how it was measured" }
        metric: null,
      },
      {
        name: "VillaOps",
        url: "https://villaops.selenasystems.com",
        category: "Villa & hospitality operations",
        text: "An operating system for villa management and guest services — day-to-day operations organized into one clear workflow.",
        layers: ["AI Operations", "AI Automation"],
        // TODO(Selena): metric = { value: "…", basis: "period · how it was measured" }
        metric: null,
      },
    ] as ProofProject[],
  },
  finalCta: {
    eyebrow: "Next step",
    headline: "Start with the manual work that is already costing you time.",
    text:
      "Book an AI Audit. We will map the current workflow, identify the highest-leverage system to build first and show what can realistically be automated.",
  },
  footerNote:
    "Selena Systems builds AI-powered operating systems for growing businesses. Process first, tools second.",
};

export type HomepageContent = typeof homepage;
