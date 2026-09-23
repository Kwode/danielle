import { MemoryPhoto, MemoryVideo, ReasonLove, MusicTrack, BirthdayWish } from '../types';

export const DANIELLE_NAME = 'Danielle Sarah Festus';
export const DANIELLE_NICKNAMES = ['My Queen', 'Dani', 'My Sweetheart', 'Beautiful'];

export const DEFAULT_HEARTFELT_LETTER = `My Dearest Danielle Sarah Festus,

Happy Birthday to the most extraordinary, breathtaking, and radiant woman in my world.

From the very first moment you came into my life, you brought a gentle warmth that made this "thing" more meaningful. Your laugh is my absolute favorite sound -- there's no emojis here(suck it!), and your beauty shines from the depths of your timid heart and your forehead.

On your special day, I want you to remember how deeply loved, admired, and cherished you are. You deserve all the happiness, all the flowers, all the gentle banters, and all your wildest dreams coming true. Thank you for being my constant smile, my peace, and my greatest blessing.

Here is to another magical year of laughter, adventures and late-night talks.

Happy Birthday, my love. Forever and always.

With love,
Yours always 💕`;

export const DEFAULT_PHOTOS: MemoryPhoto[] = [];

export const DEFAULT_VIDEOS: MemoryVideo[] = [];

export const REASONS_WHY: ReasonLove[] = [
  {
    id: 1,
    title: 'Your Radiant, Room-Illuminating Smile',
    description:
      'The way your eyes crinkle at the corners whenever you genuinely smile is pure magic. It is not just an expression; it is an entire shift in the room’s atmosphere. No matter how heavy, chaotic, or exhausting my day has been, a single glimpse of your smile instantly dissolves every trace of worry and fills my world with warmth, hope, and unshakeable peace.',
    reflection: '“Your smile is my daily reminder that true sunshine doesn’t come from the sky—it comes from you.”',
    tag: 'Unmatched Warmth',
    iconName: 'Sparkles',
  },
  {
    id: 2,
    title: 'Your Pure, Generous & Compassionate Heart',
    description:
      'You possess a gentle empathy and emotional depth that is exceedingly rare in this world. The tender patience you extend to everyone around you, how you listen with your whole being, and how deeply you genuinely care about people’s happiness inspires me constantly. You give love freely, forgive with abundant grace, and make everyone around you feel valued, respected, and deeply safe.',
    reflection: '“In a world that can often feel rushed and harsh, your heart is a gentle haven of pure kindness.”',
    tag: 'Soul of Gold',
    iconName: 'HeartHandshake',
  },
  {
    id: 3,
    title: 'Your Infectious, Unfiltered Laughter',
    description:
      'Hearing you burst into honest, unfiltered laughter is my absolute favorite sound in this entire universe. It is bubbly, playful, completely genuine, and so wonderfully contagious that nobody nearby can resist smiling along with you. When you laugh so hard your shoulders bounce and you catch your breath with that little giggle, my heart completely melts all over again.',
    reflection: '“If joy had a voice, it would sound exactly like your laughter ringing across the room.”',
    tag: 'Pure Joy',
    iconName: 'Smile',
  },
  {
    id: 4,
    title: 'Your Grace, Poise & Sweet Confidence',
    description:
      'There is an effortless elegance in how you carry yourself every single day. Whether you are dressed up for a special celebration or simply lounging around in your favorite cozy clothes, your natural beauty, poise, and dignified confidence captivate me. You carry a quiet royalty that never needs to shout; you command respect and adoration simply by being your authentic self.',
    reflection: '“You carry yourself like the queen you are—regal, poised, and utterly breathtaking.”',
    tag: 'Breathtaking',
    iconName: 'Crown',
  },
  {
    id: 5,
    title: 'Your Eye for Beauty & Passion for Pink',
    description:
      'I adore your delicate aesthetic sensibility—the way you find joy in pretty flowers, pastel sunsets, cute pastries, and soft blush tones. You remind me to slow down and notice the poetry in life’s smaller, sweeter details. Your love for warmth, elegance, and romantic charm isn’t just an aesthetic; it is a direct reflection of how tenderly, creatively, and lovingly you view the world.',
    reflection: '“You paint the world in the sweetest shades of rose, turning ordinary moments into poetry.”',
    tag: 'Sweetest Aesthetic',
    iconName: 'Palette',
  },
  {
    id: 6,
    title: 'Our Endless Late-Night Conversations',
    description:
      'Those quiet, sacred hours when the world has fallen asleep and it’s just you and me talking about everything and nothing are some of the happiest moments of my life. We travel from silly inside jokes and playful teasing to our deepest vulnerabilities, childhood stories, and future dreams. With you, conversation flows like breathing, and hours vanish like seconds.',
    reflection: '“You are my favorite person to talk to, my trusted secret-keeper, and my safest sanctuary.”',
    tag: 'My Safe Place',
    iconName: 'Moon',
  },
  {
    id: 7,
    title: 'Your Quiet Strength & Relentless Ambition',
    description:
      'Behind your sweetness lies a powerful, determined backbone and an inspiring resilience. When you set your mind on a goal, you pursue it with focus, intelligence, and grace. Watching you overcome obstacles and chase your aspirations motivates me to rise higher every single day. I respect your brilliant mind and cherish your unstoppable spirit.',
    reflection: '“Your courage doesn’t roar—it persists quietly and beautifully, turning mountains into stepping stones.”',
    tag: 'Inspiring Force',
    iconName: 'Flame',
  },
  {
    id: 8,
    title: 'Being My Unwavering Anchor & Cheerleader',
    description:
      'In a world filled with constant noise and uncertainty, knowing that you believe in me gives me courage I never knew I possessed. You celebrate my smallest victories with genuine enthusiasm and lift my spirits whenever self-doubt creeps in. Your loyalty, support, and reassuring touch make me feel like I can take on any challenge.',
    reflection: '“Having you stand by my side makes me feel like the strongest, luckiest person alive.”',
    tag: 'My Rock',
    iconName: 'ShieldHeart',
  },
  {
    id: 9,
    title: 'The Tender Comfort of Every Embrace',
    description:
      'There is nowhere on this earth that feels safer, warmer, or more restorative than being wrapped in your arms. When I hold you close, the chaos of the outside world fades into complete silence, and everything feels right and balanced. Your embrace carries a quiet tenderness that speaks directly to my soul, washing away any fatigue.',
    reflection: '“With you, home isn’t an address or a building—it is anywhere I can hold you in my arms.”',
    tag: 'Home In Your Arms',
    iconName: 'Heart',
  },
  {
    id: 10,
    title: 'Simply Being YOU: Danielle Sarah Festus',
    description:
      'Out of eight billion people wandering this earth, there is only one Danielle Sarah Festus. You are unique, precious, irreplaceable, and wonderfully made. Thank you for your radiant soul, your unconditional kindness, your brilliance, and the greatest honor of my life: having you as my favorite person. Today and every single day, I celebrate the incomparable blessing that is you.',
    reflection: '“You are my answered prayer, my deepest joy, and my forever favorite chapter in this life.”',
    tag: 'One in 8 Billion',
    iconName: 'Gift',
  },
];

export const DEFAULT_TRACK: MusicTrack = {
  id: 'older-sasha-sloan',
  title: 'Older',
  artist: 'Sasha Sloan',
  type: 'youtube',
  youtubeId: 'r1Fx0tqK5Z4',
  duration: '3:05',
};

export const MUSIC_PLAYLIST: MusicTrack[] = [DEFAULT_TRACK];

export const DEFAULT_WISHES: BirthdayWish[] = [
  {
    id: 'w-1',
    author: 'With All My Heart',
    message: 'Happy Birthday Danielle! May your year ahead be as breathtaking and lovely as you are.',
    emoji: '💖',
    timestamp: 'Today, Just for You',
  },
  {
    id: 'w-2',
    author: 'Forever Devoted',
    message: 'To Sarah, my forever blessing — another year more magnificent than the last! 🥂🎂',
    emoji: '✨',
    timestamp: 'Special Day',
  },
  {
    id: 'w-3',
    author: 'Your Number One Fan',
    message: 'Danielle Sarah Festus, may all your wildest hopes and prayers come true this year! 🌸',
    emoji: '👑',
    timestamp: 'Birthday Wish',
  },
];
