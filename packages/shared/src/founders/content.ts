/**
 * Canonical founder profiles — sourced from AuthorityNova production content.
 *
 * Source of truth (update there first, then sync here):
 *   Authoritynova/authoritynova-app/authoritynova-app/frontend/src/lib/aboutContent.js
 *   Authoritynova/authoritynova-app/authoritynova-app/frontend/public/img/founders/
 *
 * Architecture:
 *   AuthorityNova aboutContent.js → @boldmeet/shared founders → BoldMeet About page
 */

export const FOUNDER_CONTENT_SOURCE = {
  project: 'AuthorityNova',
  contentPath:
    'authoritynova-app/authoritynova-app/frontend/src/lib/aboutContent.js',
  assetsPath:
    'authoritynova-app/authoritynova-app/frontend/public/img/founders/',
  lastSynced: '2025-06-22',
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

/** BoldMeet-specific roles; bios adapted from AuthorityNova ABOUT_LEADERS. */
export const BOLDMEET_FOUNDERS: FounderProfile[] = [
  {
    id: 'sambhav-kumar',
    name: 'Dr. Sambhav Kumar',
    role: 'Founder & CEO',
    photo: '/founders/sambhav-kumar.png',
    photoFocus: 'center 38%',
    bio: [
      'Dr. Sambhav Kumar is the Founder & CEO of BoldMeet and the technology architect behind the platform\'s meeting, webinar, and virtual events infrastructure.',
      'With more than 21 years of experience in software engineering, enterprise architecture, digital transformation, automation systems, and product innovation, he has spent his career building scalable technology solutions that solve complex business challenges.',
      'After years of studying how professionals connect, collaborate, and grow online, he recognized a recurring problem: most teams struggle with fragmented, expensive, or unreliable video tools — not because they lack ambition, but because they lack a unified platform built for modern work.',
      'That insight became the foundation of BoldMeet.',
      'Today, he leads platform architecture, product engineering, security infrastructure, and innovation initiatives that power the BoldMeet ecosystem.',
    ],
    focusLabel: 'Areas of expertise',
    focus: [
      'Enterprise Software Architecture',
      'Video & Real-Time Communication',
      'Product Innovation',
      'Workflow Automation',
      'Digital Transformation',
      'Secure Cloud Infrastructure',
      'AI-Powered Productivity',
      'Virtual Events Technology',
    ],
    quote:
      'Professional communication should be reliable, accessible, and engineered for scale — not held back by fragmented tools.',
    social: {
      linkedin: 'https://www.linkedin.com/in/thesambhavkumar/',
      x: 'https://x.com/thesambhavkumar',
      instagram: 'https://www.instagram.com/thesambhavkumar/',
      website: 'https://robozant.com',
    },
  },
  {
    id: 'ayush-prajapati',
    name: 'Ayush Prajapati',
    role: 'Co-Founder & Chief Growth Officer',
    photo: '/founders/ayush-prajapati.jpg',
    photoWebp: '/founders/ayush-prajapati.webp',
    photoFocus: 'center 42%',
    bio: [
      'Ayush Prajapati is the Co-Founder & Chief Growth Officer of BoldMeet, leading growth strategy, customer acquisition, product positioning, and market expansion.',
      'Driven by a passion for helping businesses and creators connect through technology, Ayush focuses on building scalable go-to-market systems that help coaches, consultants, educators, agencies, and teams adopt BoldMeet with confidence.',
      'Under his leadership, BoldMeet is expanding as an affordable, professional communication platform — combining meetings, webinars, registrations, and collaboration into one seamless experience.',
    ],
    focusLabel: 'Focus areas',
    focus: [
      'Business Growth',
      'Go-To-Market Strategy',
      'Customer Acquisition',
      'Product Positioning',
      'Strategic Partnerships',
      'Founder & Team Branding',
      'Webinar & Events Marketing',
      'Community Building',
    ],
    quote:
      'Great products win when they remove friction — BoldMeet helps professionals show up, connect, and grow without limits.',
    social: {
      linkedin: 'https://www.linkedin.com/in/ayushprajapatiofficial/',
      x: 'https://x.com/Ayushpromax',
    },
  },
];

export const BOLDMEET_ABOUT_CONTENT = {
  hero: {
    eyebrow: 'About BoldMeet',
    title: 'About BoldMeet',
    subtitle:
      'BoldMeet is a modern video conferencing, webinar and virtual events platform built to help businesses, coaches, consultants, educators, agencies and teams connect without limits.',
  },
  story: {
    title: 'Why We Built BoldMeet',
    paragraphs: [
      'Most video conferencing tools are either expensive, complicated, fragmented or lack the flexibility needed by modern businesses.',
      'BoldMeet was built to provide a reliable, scalable and affordable communication platform that combines meetings, webinars, registrations, collaboration and future AI-powered productivity features into one seamless experience.',
      'Whether you\'re hosting a team meeting, coaching session, webinar, classroom or virtual event, BoldMeet helps you connect confidently.',
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
  differentiators: [
    'HD Video Meetings',
    'Webinar Registration',
    'Attendee Management',
    'Screen Sharing',
    'Chat & Collaboration',
    'Meeting Analytics',
    'Secure Infrastructure',
    'Future AI Features',
    'Mobile & PWA Ready',
  ],
  values: [
    { title: 'Customer First', body: 'Every decision starts with how it helps our users connect and succeed.' },
    { title: 'Innovation', body: 'We continuously improve with modern technology and thoughtful product design.' },
    { title: 'Simplicity', body: 'Powerful features should feel effortless — no steep learning curves required.' },
    { title: 'Reliability', body: 'Meetings matter. We build for uptime, clarity, and consistent performance.' },
    { title: 'Privacy & Security', body: 'Your conversations and data deserve enterprise-grade protection.' },
    { title: 'Continuous Improvement', body: 'We ship, listen, and iterate based on real user feedback.' },
  ],
  roadmap: [
    'AI Meeting Assistant',
    'Meeting Summaries',
    'AI Transcriptions',
    'Meeting Recordings',
    'Webinar Automation',
    'Team Collaboration',
    'Mobile Apps',
    'Enterprise Features',
  ],
  cta: {
    title: 'Ready to Meet Smarter?',
    subtitle:
      'Start hosting meetings, webinars and virtual events with BoldMeet today.',
  },
} as const;
