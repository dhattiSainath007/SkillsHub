/**
 * SkillsHub seed: 15 realistic employee profiles + 1 HR user.
 *
 * Each profile gets an embedding by POSTing the concatenated profile text
 * to the embeddings service (defaults to http://localhost:8000).
 * If the service is unreachable, profiles are still created without
 * embeddings — re-run after starting the service to backfill.
 *
 * Passwords are all "demo1234".
 */
import "dotenv/config";
import { PrismaClient, Role, SkillCategory, Proficiency } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const EMBEDDINGS_URL = process.env.EMBEDDINGS_URL ?? "http://localhost:8000";

type SkillSpec = {
  name: string;
  category: SkillCategory;
  proficiency: Proficiency;
  yearsExperience: number;
  inferred?: boolean;
};

type ProjectSpec = {
  name: string;
  description: string;
  technologies: string[];
  durationMonths: number;
};

type ProfileSpec = {
  email: string;
  name: string;
  fullName: string;
  location: string;
  yearsExperience: number;
  summary: string;
  available: boolean;
  lastProjectEnd?: Date;
  skills: SkillSpec[];
  projects: ProjectSpec[];
};

const PROFILES: ProfileSpec[] = [
  {
    email: "rahul@skillshub.demo",
    name: "Rahul Sharma",
    fullName: "Rahul Sharma",
    location: "Mumbai",
    yearsExperience: 5,
    summary:
      "Senior frontend engineer specialized in React and Next.js. Built real-time collaboration features with Socket.IO and integrated Razorpay across consumer SaaS products.",
    available: true,
    lastProjectEnd: new Date("2025-09-15"),
    skills: [
      { name: "React", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 5 },
      { name: "Next.js", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "TypeScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "JavaScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 5, inferred: true },
      { name: "Socket.IO", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "Redux", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Tailwind CSS", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "Razorpay", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
    ],
    projects: [
      {
        name: "CollabBoard",
        description:
          "Real-time collaborative whiteboard with Socket.IO and React, supporting 50+ concurrent editors per board with optimistic conflict resolution.",
        technologies: ["React", "Socket.IO", "Node.js", "PostgreSQL"],
        durationMonths: 9,
      },
      {
        name: "PayFlow Checkout",
        description:
          "High-conversion checkout flow integrating Razorpay with retry logic and 3DS handling for an Indian D2C brand.",
        technologies: ["Next.js", "Razorpay", "TypeScript"],
        durationMonths: 6,
      },
    ],
  },
  {
    email: "priya@skillshub.demo",
    name: "Priya Patel",
    fullName: "Priya Patel",
    location: "Pune",
    yearsExperience: 4,
    summary:
      "Backend engineer with strong Java/Spring Boot experience in banking and payments. Integrated Stripe and PayU across customer onboarding flows.",
    available: true,
    skills: [
      { name: "Java", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Spring Boot", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "PostgreSQL", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4 },
      { name: "Stripe", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "PayU", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "Kafka", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "Banking", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
    ],
    projects: [
      {
        name: "KYC Onboarding Service",
        description:
          "Microservice for KYC verification at a tier-1 Indian bank, processing 10k+ applications/day with idempotent retries and audit trails.",
        technologies: ["Java", "Spring Boot", "Kafka", "PostgreSQL"],
        durationMonths: 12,
      },
      {
        name: "Payment Gateway Aggregator",
        description:
          "Unified API over Stripe and PayU with smart routing based on real-time success rate and per-currency cost.",
        technologies: ["Java", "Spring Boot", "Stripe", "PayU"],
        durationMonths: 8,
      },
    ],
  },
  {
    email: "amit@skillshub.demo",
    name: "Amit Kumar",
    fullName: "Amit Kumar",
    location: "Bangalore",
    yearsExperience: 6,
    summary:
      "DevOps/SRE engineer focused on Kubernetes and AWS. Owned multi-region production infrastructure for a fintech platform serving 5M users.",
    available: false,
    skills: [
      { name: "AWS", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 6 },
      { name: "Kubernetes", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Terraform", category: SkillCategory.TOOL, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Docker", category: SkillCategory.TOOL, proficiency: Proficiency.EXPERT, yearsExperience: 6 },
      { name: "Prometheus", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Python", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4 },
      { name: "Bash", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 6 },
      { name: "Linux", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 6 },
    ],
    projects: [
      {
        name: "Multi-region Failover",
        description:
          "Designed an active-active multi-region setup on AWS EKS with Route53 health-based routing; sub-2 minute RTO for full region loss.",
        technologies: ["AWS", "Kubernetes", "Terraform"],
        durationMonths: 10,
      },
      {
        name: "Cost Optimization Initiative",
        description:
          "Cut AWS spend 38% via spot instances, rightsizing, and reserved capacity, while improving p99 latency.",
        technologies: ["AWS", "Terraform", "Prometheus"],
        durationMonths: 4,
      },
    ],
  },
  {
    email: "sneha@skillshub.demo",
    name: "Sneha Reddy",
    fullName: "Sneha Reddy",
    location: "Hyderabad",
    yearsExperience: 3,
    summary:
      "Full-stack engineer building HIPAA-aware healthcare apps with Next.js and TypeScript. Comfortable across the stack from UI to API to schema design.",
    available: true,
    skills: [
      { name: "Next.js", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "React", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3, inferred: true },
      { name: "TypeScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "JavaScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3, inferred: true },
      { name: "Node.js", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Prisma", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "PostgreSQL", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "Healthcare", category: SkillCategory.DOMAIN, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
    ],
    projects: [
      {
        name: "Telemedicine Portal",
        description:
          "Patient-facing telemedicine app with video consultations, prescription handling, and HIPAA-compliant audit logging.",
        technologies: ["Next.js", "TypeScript", "Prisma", "PostgreSQL"],
        durationMonths: 11,
      },
      {
        name: "Clinical Trials Tracker",
        description:
          "Internal tool for clinical-trial coordinators tracking enrollment, consent, and adverse-event reports.",
        technologies: ["Next.js", "React", "Node.js"],
        durationMonths: 5,
      },
    ],
  },
  {
    email: "vikram@skillshub.demo",
    name: "Vikram Singh",
    fullName: "Vikram Singh",
    location: "Delhi",
    yearsExperience: 7,
    summary:
      "Senior Python engineer with strong Django and data-pipeline experience. Has owned large-scale ETL on AWS and adjacent ML feature pipelines.",
    available: false,
    skills: [
      { name: "Python", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 7 },
      { name: "Django", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 6 },
      { name: "Flask", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "PostgreSQL", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 7 },
      { name: "AWS", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4 },
      { name: "Airflow", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Redis", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4 },
    ],
    projects: [
      {
        name: "Recommendations Pipeline",
        description:
          "Daily batch pipeline producing user-recommendation features for a content platform, processing 200M events with Airflow.",
        technologies: ["Python", "Airflow", "AWS"],
        durationMonths: 14,
      },
      {
        name: "Admin Backoffice (Django)",
        description:
          "Internal CRM and admin tools for a logistics startup, replacing an aging PHP system.",
        technologies: ["Python", "Django", "PostgreSQL"],
        durationMonths: 9,
      },
    ],
  },
  {
    email: "anjali@skillshub.demo",
    name: "Anjali Gupta",
    fullName: "Anjali Gupta",
    location: "Bangalore",
    yearsExperience: 4,
    summary:
      "iOS engineer specializing in Swift and SwiftUI. Has shipped multiple fintech apps including a popular UPI wallet on the App Store.",
    available: true,
    skills: [
      { name: "Swift", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "SwiftUI", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "UIKit", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "iOS", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Combine", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "Fintech", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "UPI", category: SkillCategory.DOMAIN, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
    ],
    projects: [
      {
        name: "UPI Wallet App",
        description:
          "Consumer iOS UPI wallet supporting QR scan, P2P transfers, and merchant payments with strong KYC integration.",
        technologies: ["Swift", "SwiftUI", "UPI"],
        durationMonths: 12,
      },
      {
        name: "Investment Tracker",
        description:
          "Personal-finance iOS app aggregating mutual-fund and stock portfolios with live NAV updates.",
        technologies: ["Swift", "Combine", "UIKit"],
        durationMonths: 7,
      },
    ],
  },
  {
    email: "rohan@skillshub.demo",
    name: "Rohan Mehta",
    fullName: "Rohan Mehta",
    location: "Pune",
    yearsExperience: 5,
    summary:
      "Android engineer with deep Kotlin and Jetpack Compose experience. Recently led the migration of a 1M-MAU app from XML views to Compose.",
    available: true,
    skills: [
      { name: "Kotlin", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 5 },
      { name: "Jetpack Compose", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "Android", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 5 },
      { name: "Coroutines", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Room", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Java", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4, inferred: true },
    ],
    projects: [
      {
        name: "Compose Migration",
        description:
          "Migrated a 1M-MAU consumer Android app from XML views to Jetpack Compose incrementally, with no regressions in production.",
        technologies: ["Kotlin", "Jetpack Compose"],
        durationMonths: 10,
      },
      {
        name: "Logistics Driver App",
        description:
          "Offline-first driver app for a last-mile logistics company, with route optimization and proof-of-delivery capture.",
        technologies: ["Kotlin", "Room", "Coroutines"],
        durationMonths: 8,
      },
    ],
  },
  {
    email: "kavya@skillshub.demo",
    name: "Kavya Iyer",
    fullName: "Kavya Iyer",
    location: "Chennai",
    yearsExperience: 3,
    summary:
      "React Native developer building cross-platform e-commerce apps. Comfortable with bridging native modules when performance demands it.",
    available: false,
    skills: [
      { name: "React Native", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "React", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3, inferred: true },
      { name: "JavaScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "TypeScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "Redux", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "iOS", category: SkillCategory.PLATFORM, proficiency: Proficiency.NOVICE, yearsExperience: 2 },
      { name: "Android", category: SkillCategory.PLATFORM, proficiency: Proficiency.NOVICE, yearsExperience: 2 },
    ],
    projects: [
      {
        name: "Grocery Delivery App",
        description:
          "Cross-platform RN app for a regional grocery chain with realtime order tracking and delivery-slot booking.",
        technologies: ["React Native", "TypeScript", "Redux"],
        durationMonths: 9,
      },
    ],
  },
  {
    email: "arjun@skillshub.demo",
    name: "Arjun Nair",
    fullName: "Arjun Nair",
    location: "Bangalore",
    yearsExperience: 1.5,
    summary:
      "Junior frontend developer comfortable with React and Tailwind. Ramping up on TypeScript and contributing to internal tooling.",
    available: true,
    skills: [
      { name: "React", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.NOVICE, yearsExperience: 1.5 },
      { name: "JavaScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.NOVICE, yearsExperience: 1.5 },
      { name: "Tailwind CSS", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 1.5 },
      { name: "HTML", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "CSS", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "TypeScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.NOVICE, yearsExperience: 1 },
    ],
    projects: [
      {
        name: "Internal Admin Dashboard",
        description:
          "Built UI components and dashboard pages for an internal ops tool used by the customer-support team.",
        technologies: ["React", "Tailwind CSS"],
        durationMonths: 6,
      },
    ],
  },
  {
    email: "pooja@skillshub.demo",
    name: "Pooja Joshi",
    fullName: "Pooja Joshi",
    location: "Mumbai",
    yearsExperience: 4,
    summary:
      "QA automation engineer covering web and mobile. Builds maintainable test suites with Playwright, Selenium, and Cypress; comfortable wiring them into CI.",
    available: true,
    skills: [
      { name: "Playwright", category: SkillCategory.TOOL, proficiency: Proficiency.EXPERT, yearsExperience: 2 },
      { name: "Selenium", category: SkillCategory.TOOL, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Cypress", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "JavaScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4 },
      { name: "Python", category: SkillCategory.LANGUAGE, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Jenkins", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Test Automation", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
    ],
    projects: [
      {
        name: "E2E Test Harness",
        description:
          "Migrated Selenium suite to Playwright for a SaaS platform, cutting flake by 70% and runtime from 50 min to 12 min.",
        technologies: ["Playwright", "JavaScript", "Jenkins"],
        durationMonths: 6,
      },
      {
        name: "Mobile Regression Suite",
        description:
          "Set up Appium-based regression suite for a retail Android app integrated with the release pipeline.",
        technologies: ["Selenium", "Python"],
        durationMonths: 8,
      },
    ],
  },
  {
    email: "karthik@skillshub.demo",
    name: "Karthik Rao",
    fullName: "Karthik Rao",
    location: "Bangalore",
    yearsExperience: 3,
    summary:
      "Node.js backend engineer building API-first products with NestJS, GraphQL, and PostgreSQL. Strong on schema design and DX.",
    available: true,
    skills: [
      { name: "Node.js", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "NestJS", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 2 },
      { name: "GraphQL", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "TypeScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "JavaScript", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 3, inferred: true },
      { name: "PostgreSQL", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Prisma", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
    ],
    projects: [
      {
        name: "API Gateway Service",
        description:
          "GraphQL gateway federating five internal microservices for a B2B marketplace, with role-based field-level auth.",
        technologies: ["NestJS", "GraphQL", "TypeScript", "PostgreSQL"],
        durationMonths: 9,
      },
      {
        name: "Notifications Microservice",
        description:
          "Multi-channel notifications service (email, SMS, push) with templating, rate-limiting and retries.",
        technologies: ["Node.js", "NestJS", "PostgreSQL"],
        durationMonths: 5,
      },
    ],
  },
  {
    email: "divya@skillshub.demo",
    name: "Divya Krishnan",
    fullName: "Divya Krishnan",
    location: "Hyderabad",
    yearsExperience: 5,
    summary:
      "Data engineer focused on Spark and Airflow pipelines feeding Snowflake. Owned analytics infrastructure for a 50M-user consumer app.",
    available: false,
    skills: [
      { name: "Spark", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Airflow", category: SkillCategory.TOOL, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Snowflake", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "Python", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 5 },
      { name: "SQL", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 5 },
      { name: "dbt", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 2 },
      { name: "AWS", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4 },
    ],
    projects: [
      {
        name: "Analytics Lakehouse",
        description:
          "Built a Spark-on-EMR + Snowflake lakehouse ingesting 2TB/day; rebuilt 80+ legacy reports in dbt with tests.",
        technologies: ["Spark", "Snowflake", "Airflow", "dbt"],
        durationMonths: 14,
      },
    ],
  },
  {
    email: "sanjay@skillshub.demo",
    name: "Sanjay Verma",
    fullName: "Sanjay Verma",
    location: "Pune",
    yearsExperience: 10,
    summary:
      "Senior architect with deep Java + microservices background. Has designed event-driven systems on Kafka for trading and telecom domains.",
    available: false,
    skills: [
      { name: "Java", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 10 },
      { name: "Spring Boot", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 8 },
      { name: "Microservices", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 8 },
      { name: "Kafka", category: SkillCategory.TOOL, proficiency: Proficiency.EXPERT, yearsExperience: 6 },
      { name: "Kubernetes", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 4 },
      { name: "System Design", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 10 },
      { name: "PostgreSQL", category: SkillCategory.PLATFORM, proficiency: Proficiency.EXPERT, yearsExperience: 10 },
    ],
    projects: [
      {
        name: "Trading Platform Re-architecture",
        description:
          "Re-architected a monolithic trading platform into 20+ event-driven microservices on Kafka, halving incident frequency.",
        technologies: ["Java", "Spring Boot", "Kafka", "Kubernetes"],
        durationMonths: 18,
      },
      {
        name: "Telecom Billing System",
        description:
          "Greenfield design of a billing engine handling 100M+ CDRs/day for a tier-1 telecom operator.",
        technologies: ["Java", "Kafka", "PostgreSQL"],
        durationMonths: 14,
      },
    ],
  },
  {
    email: "neha@skillshub.demo",
    name: "Neha Kapoor",
    fullName: "Neha Kapoor",
    location: "Delhi",
    yearsExperience: 4,
    summary:
      "Designer-developer hybrid. Owns the design-to-code loop: Figma prototypes through to production React + Tailwind components.",
    available: true,
    skills: [
      { name: "Figma", category: SkillCategory.TOOL, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "UX Design", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "UI Design", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "React", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
      { name: "Tailwind CSS", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "Design Systems", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "Accessibility", category: SkillCategory.DOMAIN, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
    ],
    projects: [
      {
        name: "Design System Rollout",
        description:
          "Designed and implemented a Tailwind-based design system used across 6 product surfaces, including accessibility audits.",
        technologies: ["Figma", "React", "Tailwind CSS"],
        durationMonths: 8,
      },
      {
        name: "Patient Portal Redesign",
        description:
          "End-to-end redesign of a hospital patient portal, including usability research with elderly users.",
        technologies: ["Figma", "React"],
        durationMonths: 6,
      },
    ],
  },
  {
    email: "manish@skillshub.demo",
    name: "Manish Agarwal",
    fullName: "Manish Agarwal",
    location: "Bangalore",
    yearsExperience: 4,
    summary:
      "ML engineer building production RAG and LLM systems. Strong with PyTorch and LangChain; has shipped retrieval and ranking pipelines at scale.",
    available: true,
    skills: [
      { name: "Python", category: SkillCategory.LANGUAGE, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "PyTorch", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "LangChain", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 2 },
      { name: "RAG", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 2 },
      { name: "Machine Learning", category: SkillCategory.DOMAIN, proficiency: Proficiency.EXPERT, yearsExperience: 4 },
      { name: "Transformers", category: SkillCategory.FRAMEWORK, proficiency: Proficiency.EXPERT, yearsExperience: 3 },
      { name: "pgvector", category: SkillCategory.TOOL, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 1 },
      { name: "AWS", category: SkillCategory.PLATFORM, proficiency: Proficiency.INTERMEDIATE, yearsExperience: 3 },
    ],
    projects: [
      {
        name: "Internal Knowledge RAG",
        description:
          "Production RAG system over 100k+ internal docs, with hybrid retrieval (BM25 + dense) and citation grounding.",
        technologies: ["LangChain", "PyTorch", "pgvector"],
        durationMonths: 7,
      },
      {
        name: "Recommendation Reranker",
        description:
          "Trained a transformer-based reranker that lifted CTR by 18% over the production baseline on a content platform.",
        technologies: ["PyTorch", "Transformers", "Python"],
        durationMonths: 9,
      },
    ],
  },
];

async function fetchEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${EMBEDDINGS_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { embedding: number[] };
    return data.embedding;
  } catch {
    return null;
  }
}

function buildEmbeddingText(p: ProfileSpec): string {
  const skillsStr = p.skills
    .map((s) => `${s.name} (${s.proficiency}, ${s.yearsExperience} years)`)
    .join(", ");
  const projectsStr = p.projects.map((pr) => pr.description).join(" ");
  return `${p.fullName}. ${p.summary} Skills: ${skillsStr}. Projects: ${projectsStr}`;
}

async function main() {
  console.log("Resetting data...");
  await prisma.searchLog.deleteMany();
  await prisma.pendingExtraction.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  console.log("Creating HR user...");
  await prisma.user.create({
    data: {
      email: "hr@skillshub.demo",
      password: passwordHash,
      name: "HR Demo",
      role: Role.HR,
    },
  });

  let embedsOk = 0;
  let embedsFail = 0;

  for (const p of PROFILES) {
    process.stdout.write(`  ${p.fullName.padEnd(22)} `);
    const user = await prisma.user.create({
      data: {
        email: p.email,
        password: passwordHash,
        name: p.name,
        role: Role.EMPLOYEE,
        profile: {
          create: {
            fullName: p.fullName,
            location: p.location,
            yearsExperience: p.yearsExperience,
            summary: p.summary,
            available: p.available,
            lastProjectEnd: p.lastProjectEnd ?? null,
            skills: { create: p.skills },
            projects: { create: p.projects },
          },
        },
      },
      include: { profile: true },
    });

    const profile = user.profile!;
    const vec = await fetchEmbedding(buildEmbeddingText(p));
    if (vec && vec.length === 384) {
      const literal = `[${vec.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE profiles SET embedding = $1::vector WHERE id = $2`,
        literal,
        profile.id,
      );
      embedsOk++;
      console.log("✓ profile + embedding");
    } else {
      embedsFail++;
      console.log("✓ profile (no embedding)");
    }
  }

  console.log(`\nDone — ${PROFILES.length} profiles, ${embedsOk} embeddings.`);
  if (embedsFail > 0) {
    console.log(
      `${embedsFail} profile(s) have no embedding. Is the embeddings service running at ${EMBEDDINGS_URL}?`,
    );
    console.log(`Once it's up, re-run \`npm run seed\` to backfill.`);
  }
  console.log(`\nLogin (password is "demo1234" for everyone):`);
  console.log(`  HR:       hr@skillshub.demo`);
  console.log(`  Employee: rahul@skillshub.demo  (and 14 others — see seed file)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
