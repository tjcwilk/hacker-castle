// challenges.js — the castle's challenges.
//
// Each entry is one "room" of the castle AND one badge on the Great Hall board.
// Every challenge has a placeholder secret flag a student submits to earn its
// badge, and its own page under /public/rooms/<slug>.html.
//
//   slug  : stable id used in URLs (/rooms/<slug>.html) and the badges table
//   name  : friendly title shown on the badge and the room door
//   icon  : emoji shown on the earned badge
//   blurb : one-line teaser for the door plaque / board
//   flag  : the secret flag that earns the badge
//
// NOTE: flags live on the server and are never sent to the browser — the
// front-end only ever learns whether a *submitted* flag was correct. (The
// tutorial and view-source rooms deliberately reveal their flag to the player
// as part of the lesson.)

module.exports = [
  {
    slug: 'tutorial',
    name: 'The Tutorial Chamber',
    icon: '🎓',
    blurb: 'New here? Learn how flags and badges work — your first flag is free.',
    flag: 'FLAG{welcome_to_hacker_castle}',
  },
  {
    slug: 'view-source',
    name: 'The Looking Glass',
    icon: '🔍',
    blurb: 'Anything sent to your browser can be read. Try viewing the page source.',
    flag: 'FLAG{view_source_sees_all}',
  },
  {
    slug: 'xss',
    name: 'The Hall of Echoes',
    icon: '💬',
    blurb: 'Cross-site scripting: make the castle run your words as code.',
    flag: 'FLAG{reflected_xss_placeholder}',
  },
  {
    slug: 'directory-traversal',
    name: 'The Hidden Passages',
    icon: '🗂️',
    blurb: 'Directory traversal: sneak past the path you were given.',
    flag: 'FLAG{dot_dot_slash_placeholder}',
  },
];
