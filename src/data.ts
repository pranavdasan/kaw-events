import { Session, Speaker, Event } from './types';
import { ONAM_POOKALAM_BASE64, VISHU_BASE64, PICNIC_BASE64, DRAMA_BASE64 } from './utils/imageUtils';

// Dynamic start time generator so the first session is actively LIVE relative to user's current clock
const getDynamicStartTime = () => {
  const d = new Date();
  const minsAgo = d.getHours() * 60 + d.getMinutes() - 15;
  const validMins = Math.max(0, minsAgo);
  const h = Math.floor(validMins / 60).toString().padStart(2, '0');
  const m = (validMins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const liveNowStartTime = getDynamicStartTime();

export const SPEAKERS: Speaker[] = [
  {
    id: 'radhika-nair',
    name: 'Radhika Nair',
    role: 'Cultural Director',
    company: 'Kerala Association of Washington',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    bio: 'Radhika has served as Cultural Director of KAW for over 5 years, preserving traditional Malayali performing arts across the Pacific Northwest.',
    linkedIn: '#',
    twitter: '#'
  },
  {
    id: 'anil-kumar',
    name: 'Anil Kumar',
    role: 'Master Chenda Artist',
    company: 'Seattle Layatharangam Melam',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    bio: 'Renowned percussionist trained in Kerala temple percussion styles, leading classical Chenda Melam ensembles in Washington State.'
  },
  {
    id: 'sreejith-varma',
    name: 'Chef Sreejith Varma',
    role: 'Culinary Lead',
    company: 'KAW Sadhya Team',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    bio: 'Expert in traditional Kerala cuisine, managing the authentic 26-item Onam Sadhya banquet for over 1,000 community attendees.'
  },
  {
    id: 'meera-menon',
    name: 'Meera Menon',
    role: 'Choreographer & Lead',
    company: 'Mohiniyattam Academy Seattle',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    bio: 'Accomplished classical dancer specializing in Mohiniyattam and Thiruvathirakali group compositions.'
  },
  {
    id: 'vinod-pillai',
    name: 'Vinod Pillai',
    role: 'Board President',
    company: 'Kerala Association of Washington',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    bio: 'President of KAW guiding civic initiatives, youth development programs, and charitable community outreach in Washington.'
  },
  {
    id: 'pooja-jayaram',
    name: 'Pooja Jayaram',
    role: 'Youth Wing Chair',
    company: 'KAW Youth Forum',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    bio: 'Organizes youth musical bands, fusion dance productions, and social causes for young Malayalis across the region.'
  }
];

export const EVENTS: Event[] = [
  {
    id: 'grand-onam-celebration-2026',
    name: 'Grand Onam Celebration 2026',
    description: 'The flagship annual cultural extravaganza of Kerala Association of Washington! Featuring Athapookalam, Chenda Melam, Maveli Welcome, Thiruvathira, and the 26-item Grand Onam Sadhya feast.',
    date: new Date().toISOString().split('T')[0],
    startTimeByDay: { 1: liveNowStartTime, 2: '10:00' },
    endTimeByDay: { 1: '18:00', 2: '17:00' },
    imageUrl: ONAM_POOKALAM_BASE64,
    totalDays: 2
  },
  {
    id: 'vishu-kerala-new-year-fest-2026',
    name: 'Vishu & Kerala New Year Fest 2026',
    description: 'Welcoming the auspicious Kerala New Year with traditional Vishukkani display, Vishukaineettam, classical music ensemble, and community feast in Greater Seattle.',
    date: '2026-04-18',
    startTimeByDay: { 1: '10:00' },
    endTimeByDay: { 1: '16:00' },
    imageUrl: VISHU_BASE64,
    totalDays: 1
  },
  {
    id: 'annual-sports-family-picnic-2026',
    name: 'Annual Sports & Family Picnic 2026',
    description: 'A vibrant day of outdoor sports, traditional games like Vadam Vali (Tug of War), payasam tasting competition, and community gathering.',
    date: '2026-07-26',
    startTimeByDay: { 1: '09:00' },
    endTimeByDay: { 1: '17:00' },
    imageUrl: PICNIC_BASE64,
    totalDays: 1
  },
  {
    id: 'youth-cultural-night-drama-fest-2025',
    name: 'Youth Cultural Night & Drama Fest 2025',
    description: 'Archive of youth artistic performances, Malayali drama skits, musical fusion bands, and annual excellence awards night.',
    date: '2025-11-15',
    startTimeByDay: { 1: '17:00' },
    endTimeByDay: { 1: '21:30' },
    imageUrl: DRAMA_BASE64,
    totalDays: 1
  }
];

export const SESSIONS: Session[] = [
  {
    id: 'onam-2026-grand-inauguration',
    eventId: 'grand-onam-celebration-2026',
    title: 'Grand Inauguration & Lighting of Bhadradeepam',
    description: 'Formal inauguration of KAW Grand Onam Celebration with traditional Nilavilakku lamp lighting, prayer song, and presidential welcome address.',
    durationInMin: 45,
    day: 1,
    track: 'Keynote',
    room: 'Main Stage',
    speakers: [SPEAKERS[4], SPEAKERS[0]],
    isLive: true,
    order: 0
  },
  {
    id: 'onam-2026-chenda-melam-maveli',
    eventId: 'grand-onam-celebration-2026',
    title: 'Chenda Melam & Royal Welcome of King Maveli',
    description: 'Traditional Panchari Melam percussion performance escorting King Mahabali (Maveli) into the main hall to bless the community.',
    durationInMin: 45,
    day: 1,
    track: 'General',
    room: 'Courtyard & Main Stage',
    speakers: [SPEAKERS[1]],
    isLive: false,
    order: 1
  },
  {
    id: 'onam-2026-athapookalam-exhibition',
    eventId: 'grand-onam-celebration-2026',
    title: 'Athapookalam Floral Carpet Exhibition',
    description: 'Live floral carpet competition featuring colorful fresh petal patterns created by neighborhood teams celebrating Kerala artistry.',
    durationInMin: 45,
    day: 1,
    track: 'Workshop',
    room: 'Community Hall A',
    speakers: [SPEAKERS[0]],
    isLive: false,
    order: 1
  },
  {
    id: 'onam-2026-thiruvathira-recitals',
    eventId: 'grand-onam-celebration-2026',
    title: 'Thiruvathira & Mohiniyattam Classical Recitals',
    description: 'Graceful Thiruvathirakali circle dance around the illuminated lamp followed by Mohiniyattam solo dance showcase.',
    durationInMin: 45,
    day: 1,
    track: 'Design',
    room: 'Main Stage',
    speakers: [SPEAKERS[3]],
    isLive: false,
    order: 2
  },
  {
    id: 'onam-2026-intermission-sadhya-seating',
    eventId: 'grand-onam-celebration-2026',
    title: 'Intermission & Onam Sadhya Seating',
    description: 'Short break while seating arrangements for the banana leaf Sadhya feast are organized.',
    durationInMin: 30,
    day: 1,
    track: 'General',
    room: 'Dining Pavilion',
    speakers: [],
    isLive: false,
    type: 'break',
    order: 3
  },
  {
    id: 'onam-2026-grand-sadhya-feast',
    eventId: 'grand-onam-celebration-2026',
    title: 'The Grand Onam Sadhya Feast (26-Item Banquet)',
    description: 'Savor the authentic Kerala vegetarian feast served on fresh banana leaves featuring Avial, Thoran, Sambar, Olan, Inji Puli, and Payasam.',
    durationInMin: 90,
    day: 1,
    track: 'General',
    room: 'Dining Pavilion',
    speakers: [SPEAKERS[2]],
    isLive: false,
    order: 4
  },
  {
    id: 'onam-2026-youth-cultural-night',
    eventId: 'grand-onam-celebration-2026',
    title: 'Youth Cultural Night, Skits & Live Band',
    description: 'High-energy cinematic dances, comedy drama skits, and Malayalam rock fusion band performances by the KAW Youth Wing.',
    durationInMin: 60,
    day: 1,
    track: 'Engineering',
    room: 'Main Stage',
    speakers: [SPEAKERS[5]],
    isLive: false,
    order: 5
  },
  {
    id: 'onam-2026-vadam-vali-championship',
    eventId: 'grand-onam-celebration-2026',
    title: 'Vadam Vali (Tug-of-War) Championship & Prize Ceremony',
    description: 'Thrilling traditional Kerala Tug-of-War competition on the outdoor lawns followed by trophies and community awards.',
    durationInMin: 60,
    day: 1,
    track: 'General',
    room: 'Outdoor Grounds',
    speakers: [SPEAKERS[4]],
    isLive: false,
    order: 6
  }
];

