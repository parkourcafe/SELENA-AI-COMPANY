export const homepage = {
  nav: [
    { label: "Problems", href: "/#problems" },
    { label: "Systems", href: "/#systems" },
    { label: "Sprint", href: "/#sprint" },
    { label: "Proof", href: "/#proof" },
    { label: "Packages", href: "/#packages" },
  ],
  cta: { label: "Book AI Audit", href: "/contact" },
  hero: {
    eyebrow: "AI-powered operating systems for growing businesses",
    headline: "Build the AI operating system your business keeps running manually.",
    subheadline:
      "Selena Systems designs and builds AI systems for sales, content, operations, documents, customer communication and internal workflows - without turning your business into a tool experiment.",
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
        text: "Inquiries arrive through forms, DMs, WhatsApp, email and referrals with no clean path to the next action.",
      },
      {
        title: "Manual customer communication",
        text: "The same answers, booking details, pricing notes and follow-ups are written from scratch every day.",
      },
      {
        title: "Slow content production",
        text: "Ideas exist, but turning them into posts, emails, briefs and campaigns still depends on one overloaded person.",
      },
      {
        title: "Overloaded team",
        text: "People are busy moving information between tools instead of improving the customer experience.",
      },
      {
        title: "Knowledge spread across tools",
        text: "Policies, SOPs, offers, scripts and documents sit in chats, drives, notes and memory.",
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
  packages: [
    {
      name: "AI Audit",
      price: "$500",
      description: "A focused diagnostic for founders who need clarity before building.",
      included: ["Workflow review", "AI opportunity map", "Priority recommendations"],
      featured: false,
    },
    {
      name: "AI Sprint",
      price: "$4,000",
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
  proof: {
    eyebrow: "Proof of operating range",
    headline: "Systems thinking across hospitality, care, service and online operations.",
    projects: [
      {
        name: "KORA Food Hall",
        category: "Hospitality operations",
        text: "Menu, vendor, customer communication and local operations workflows shaped into a clearer operating model.",
      },
      {
        name: "PetID.care",
        category: "Care and service infrastructure",
        text: "Customer, pet profile and support workflows organized around trust, data and repeatable assistance.",
      },
      {
        name: "Doki.help",
        category: "Documents and support",
        text: "Document-heavy processes translated into clearer guidance, intake and customer-facing support paths.",
      },
      {
        name: "Makeup.cafe",
        category: "Education and content",
        text: "Beauty education, service packaging and content workflows structured for practical execution.",
      },
    ],
  },
  finalCta: {
    headline: "Start with the manual work that is already costing you time.",
    text:
      "Book an AI Audit. We will map the current workflow, identify the highest-leverage system to build first and show what can realistically be automated.",
  },
  footerNote:
    "Selena Systems builds AI-powered operating systems for growing businesses. Process first, tools second.",
} as const;
