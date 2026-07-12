const ENV = {
  USE_MOCK: false,
  API_BASE_URL: 'https://clearstock-ghana.onrender.com',
  // Render's free tier cold-starts (~30–60s) after idle, so allow a generous
  // timeout. The client also warms the backend on launch and retries once.
  API_TIMEOUT: 60000,

  // Cloudinary unsigned upload — lets picked images become real hosted URLs
  // that display on every device. Create a free account, add an *unsigned*
  // upload preset, then fill these in. If left blank, image upload is skipped
  // and listings fall back to the initials placeholder.
  CLOUDINARY_CLOUD_NAME: 'o41mj0jt',
  CLOUDINARY_UPLOAD_PRESET: 'cuteee',
} as const;

export default ENV;