const ENV = {
  USE_MOCK: false,
  API_BASE_URL: 'https://clearstock-ghana.onrender.com',
  // Render's free tier cold-starts after idle and can take well over a minute
  // to answer. Time out generously: aborting early doesn't stop the server
  // finishing the work, it just leaves the app unsure whether it happened
  // (which previously made sign-up look like it failed after it had succeeded).
  API_TIMEOUT: 120000,

  // Cloudinary unsigned upload — lets picked images become real hosted URLs
  // that display on every device. Create a free account, add an *unsigned*
  // upload preset, then fill these in. If left blank, image upload is skipped
  // and listings fall back to the initials placeholder.
  CLOUDINARY_CLOUD_NAME: 'o41mj0jt',
  CLOUDINARY_UPLOAD_PRESET: 'cuteee',
} as const;

export default ENV;