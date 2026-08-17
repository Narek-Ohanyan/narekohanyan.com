<?php
/* Template. Copy this to api/secrets.php and fill in the real key — that
   filename is gitignored, so it is never committed. Upload it once via
   Hostinger's File Manager (or FTP); a git-triggered deploy that only
   updates tracked files will not touch or remove it afterwards.

   If Hostinger's plan for this account exposes real PHP environment
   variables (hPanel → Advanced), set GEMINI_API_KEY there instead and skip
   this file entirely — _gemini-core.php checks getenv() first and only
   falls back to this file when an environment variable is not visible. */
return [
  'GEMINI_API_KEY'  => 'your-key-here',

  // Optional — sensible defaults are used if omitted.
  // 'GEMINI_MODEL'    => 'gemini-3-flash-preview',
  // 'ALLOWED_ORIGINS' => 'https://narekohanyan.com,https://www.narekohanyan.com',
];
