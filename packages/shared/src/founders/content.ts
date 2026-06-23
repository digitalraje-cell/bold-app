/**
 * Canonical founder profiles — sourced from AuthorityNova production content.
 *
 * Source of truth (update there first, then sync here):
 *   https://www.authoritynova.com/about
 *   authoritynova-app/frontend/src/lib/aboutContent.js
 *   authoritynova-app/frontend/public/img/founders/
 *
 * Architecture:
 *   AuthorityNova aboutContent.js → @boldmeet/shared founders → Bold About page
 */

export const FOUNDER_CONTENT_SOURCE = {
  project: 'AuthorityNova',
  contentPath:
    'authoritynova-app/authoritynova-app/frontend/src/lib/aboutContent.js',
  assetsPath:
    'authoritynova-app/authoritynova-app/frontend/public/img/founders/',
  lastSynced: '2026-06-22',
  sourceUrl: 'https://www.authoritynova.com/about',
} as const;

export interface FounderSocialLinks {
  linkedin?: string;
  x?: string;
  website?: string;
  instagram?: string;
}

export interface FounderProfile {
  id: string;
  name: string;
  role: string;
  photo: string;
  photoWebp?: string;
  photoFocus?: string;
  bio: string[];
  focusLabel: string;
  focus: string[];
  quote?: string;
  social: FounderSocialLinks;
}

/** Bold-specific roles and bios adapted from AuthorityNova Executive Team. */
export const BOLD_FOUNDERS: FounderProfile[] = [
  {
    id: 'ayush-prajapati',
    name: 'Ayush Prajapati',
    role: 'Founder & CEO',
    photo: '/founders/ayush-prajapati.jpg',
    photoWebp: '/founders/ayush-prajapati.webp',
    photoFocus: 'center 42%',
    bio: [
      'Ayush Prajapati is the Founder & CEO of Bold, leading the company\'s vision, growth strategy, customer acquisition, product positioning, and market expansion.',
      'Driven by a passion for helping professionals connect through technology, Ayush focuses on creating scalable systems that help founders, coaches, consultants, agencies, and teams host meetings, webinars, and virtual events with confidence.',
      'Under his leadership, Bold is building the next generation of browser-based communication infrastructure that enables professionals to meet, collaborate, and grow without friction or unnecessary complexity.',
    ],
    focusLabel: 'Focus areas',
    focus: [
      'Business Growth',
      'Go-To-Market Strategy',
      'Founder Branding',
      'Product Positioning',
      'Customer Acquisition',
      'Strategic Partnerships',
      'Webinar & Events Marketing',
      'Community Building',
    ],
    quote:
      'Trust isn\'t built by adding more tools. It\'s built by creating systems that compound reliability over time.',
    social: {
      linkedin: 'https://www.linkedin.com/in/ayushprajapatiofficial/',
      x: 'https://x.com/Ayushpromax',
    },
  },
  {
    id: 'sambhav-kumar',
    name: 'Dr. Sambhav Kumar',
    role: 'Co-Founder & CTO',
    photo: '/founders/sambhav-kumar.png',
    photoFocus: 'center 38%',
    bio: [
      'Dr. Sambhav Kumar is the Co-Founder & CTO of Bold and the technology architect behind the platform\'s meeting, webinar, and virtual events engine.',
      'With more than 21 years of experience in software engineering, enterprise architecture, digital transformation, automation systems, and product innovation, he has spent his career building scalable technology solutions that solve complex business challenges.',
      'After years of studying how professionals connect, collaborate, and grow online, he recognized a recurring problem: most teams struggle with fragmented, expensive, or unreliable video tools — not because they lack ambition, but because they lack a unified platform built for modern work.',
      'That insight became the foundation of Bold.',
      'Today, he leads platform architecture, real-time communication systems, security infrastructure, and product engineering initiatives that power the Bold ecosystem.',
    ],
    focusLabel: 'Areas of expertise',
    focus: [
      'Artificial Intelligence & Automation',
      'Enterprise Software Architecture',
      'Real-Time Communication Systems',
      'Product Innovation',
      'Virtual Events Technology',
      'Meeting Infrastructure',
      'Workflow Automation',
      'Digital Transformation',
    ],
    quote:
      'Professional communication should be engineered through systems, amplified through technology, and sustained through reliable infrastructure.',
    social: {
      linkedin: 'https://www.linkedin.com/in/thesambhavkumar/',
      x: 'https://x.com/thesambhavkumar',
      instagram: 'https://www.instagram.com/thesambhavkumar/',
      website: 'https://robozant.com',
    },
  },
];

/** @deprecated use BOLD_FOUNDERS */
export const BOLDMEET_FOUNDERS = BOLD_FOUNDERS;

export const BOLD_ABOUT_CONTENT = {
  hero: {
    eyebrow: 'About Bold',
    title: 'About Bold',
    subtitle:
      'Bold is a modern video conferencing, webinar and virtual events platform built to help businesses, coaches, consultants, educators, agencies and teams connect without limits.',
  },
  story: {
    title: 'Why We Built Bold',
    paragraphs: [
      'Most video conferencing tools are either expensive, complicated, fragmented or lack the flexibility needed by modern businesses.',
      'Bold was built to provide a reliable, scalable and affordable communication platform that combines meetings, webinars, registrations, collaboration and future AI-powered productivity features into one seamless experience.',
      'Founded by Ayush Prajapati and Dr. Sambhav Kumar, Bold combines entrepreneurial vision, growth strategy, and more than two decades of technology leadership to help professionals connect confidently.',
      'Whether you\'re hosting a team meeting, coaching session, webinar, classroom or virtual event, Bold helps you show up without compromise.',
    ],
  },
  mission: {
    title: 'Our Mission',
    body: 'To make professional virtual communication accessible, affordable and powerful for everyone—from solo creators and educators to growing businesses and global teams.',
  },
  vision: {
    title: 'Our Vision',
    body: 'To become the most trusted all-in-one platform for meetings, webinars, collaboration and AI-powered communication.',
  },
  audiences: [
    {
      id: 'coaches',
      title: 'Built for Coaches',
      body: 'Run 1:1 sessions, group coaching calls, and client workshops with reliable HD video — no complicated setup between you and your clients.',
    },
    {
      id: 'educators',
      title: 'Built for Educators',
      body: 'Host classrooms, office hours, and training sessions with screen sharing, chat, and attendee management designed for teaching at scale.',
    },
    {
      id: 'agencies',
      title: 'Built for Agencies',
      body: 'Present to clients, run internal standups, and deliver webinars from one professional platform your whole team can adopt quickly.',
    },
    {
      id: 'teams',
      title: 'Built for Teams',
      body: 'Daily standups, all-hands, and cross-border collaboration — with host controls, waiting rooms, and the reliability modern teams expect.',
    },
  ],
  browserFirst: {
    title: 'Browser-first, install when you want',
    subtitle: 'Works instantly in your browser. Optional app installation for a native-like experience.',
    paragraphs: [
      'Bold starts in your browser — open a link and meet in seconds. When you want a faster, more app-like workflow, install Bold on desktop or mobile in one click.',
      'Guests join with a link. Hosts sign in with email. Everyone gets HD video, chat, and controls — in the browser or from your home screen.',
    ],
    points: [
      'Instant join for guests — no account required',
      'Browser-first on Mac, Windows, Chromebook, and mobile',
      'Optional PWA install for one-click launch',
      'Automatic updates — always on the latest version',
      'Native-like experience across desktop and mobile',
    ],
  },
  futureVision: {
    title: 'Future Vision',
    body: 'We are building toward the most trusted all-in-one platform for meetings, webinars, collaboration, and AI-powered communication — accessible to solo creators and global teams alike.',
    highlights: [
      'AI Meeting Assistant',
      'Meeting Summaries & Transcriptions',
      'Webinar Automation',
      'Enterprise-grade security & scale',
    ],
  },
  cta: {
    title: 'Ready to Meet Smarter?',
    subtitle: 'Start hosting meetings, webinars and virtual events with Bold today.',
  },
} as const;

/** @deprecated use BOLD_ABOUT_CONTENT */
export const BOLDMEET_ABOUT_CONTENT = BOLD_ABOUT_CONTENT;
