export const FEEDBACK_CATEGORIES = [
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Something is broken or not working as expected',
    colorKey: 'bug',
  },
  {
    id: 'ui_ux',
    label: 'UI / UX Issue',
    description: 'Layout glitch, visual defect, or awkward flow',
    colorKey: 'ui',
  },
  {
    id: 'feature_request',
    label: 'Feature Request',
    description: 'An idea or capability that would make work easier',
    colorKey: 'feature',
  },
  {
    id: 'general',
    label: 'General Feedback',
    description: 'Thoughts, praise, or general suggestions',
    colorKey: 'general',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Anything else you would like to share with us',
    colorKey: 'other',
  },
];

export const FEEDBACK_CONFIG = {
  maxAttachments: 5,
  maxFileSizeMb: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  descriptionMinLength: 10,
  descriptionMaxLength: 5000,
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
};

