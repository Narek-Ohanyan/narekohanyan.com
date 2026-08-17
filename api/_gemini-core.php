<?php
/* ═══════════════════════════════════════════════════════════════════════
   Gemini proxy — shared core (PHP / Hostinger)
   ───────────────────────────────────────────────────────────────────────
   Hostinger shared hosting serves static files and PHP; it cannot run the
   Node function in api/gemini.js, which is why /api/gemini 404'd in
   production even though it worked on localhost. This is the same proxy,
   same security properties, rewritten so the host that is actually running
   it can run it. api/gemini.js and the Netlify/Vercel adapters are left in
   place — they still apply if this site is ever deployed to either.

   The browser must never see the API key. The page posts the same payload
   it always has; this adds the key server-side and forwards it.

   ── Where the key lives ────────────────────────────────────────────────
   Checked in this order:
     1. getenv('GEMINI_API_KEY') — if Hostinger's plan exposes environment
        variables to PHP (hPanel → Advanced → some plans have this), this
        is used automatically and nothing else is needed.
     2. api/secrets.php — a file that returns an array, NOT committed to
        git (see .gitignore and api/secrets.example.php for the template).
        Upload it once via Hostinger's File Manager; a git deploy that only
        updates tracked files will not touch it.
   Whichever is present, the key is read once per request and never
   returned to the client or written to a log.

   A bare proxy is still an open relay — anyone who finds the URL can spend
   the quota. So requests are checked against an origin allowlist, capped
   in size, and rate limited per IP.
   ═══════════════════════════════════════════════════════════════════════ */

function no_gemini_config() {
  static $config = null;
  if ($config !== null) return $config;

  $key   = getenv('GEMINI_API_KEY') ?: null;
  $model = getenv('GEMINI_MODEL') ?: null;
  $allow = getenv('ALLOWED_ORIGINS') ?: null;

  $secretsFile = __DIR__ . '/secrets.php';
  if ((!$key || !$allow) && is_file($secretsFile)) {
    $fromFile = require $secretsFile;
    if (is_array($fromFile)) {
      $key   = $key   ?: ($fromFile['GEMINI_API_KEY']   ?? null);
      $model = $model ?: ($fromFile['GEMINI_MODEL']     ?? null);
      $allow = $allow ?: ($fromFile['ALLOWED_ORIGINS']  ?? null);
    }
  }

  $config = [
    'key'   => $key,
    'model' => $model ?: 'gemini-3-flash-preview',
    'allow' => array_filter(array_map('trim', explode(',', $allow ?:
      'https://narekohanyan.com,https://www.narekohanyan.com,http://localhost:4173'))),
  ];
  return $config;
}

const NO_GEMINI_MAX_BYTES      = 32 * 1024;  // a prompt this size is already generous
const NO_GEMINI_WINDOW_SECONDS = 60;
const NO_GEMINI_MAX_PER_WINDOW = 12;

/* ── rate limiting ─────────────────────────────────────────────────────
   PHP-FPM workers do not share memory the way one long-lived Node process
   does, so this is a small file per IP in the system temp directory
   instead of an in-process Map. Best effort only, same as the Node
   version's own comment says — a determined attacker can spread requests
   across workers faster than the file updates. The real ceiling is the
   spending limit set in Google Cloud Console. */
function no_gemini_rate_limited($ip) {
  $dir = sys_get_temp_dir() . '/no-gemini-rl';
  if (!is_dir($dir) && !@mkdir($dir, 0700, true)) return false; // can't enforce, don't block
  $file = $dir . '/' . preg_replace('/[^a-zA-Z0-9_.]/', '_', $ip ?: 'unknown');

  $fh = @fopen($file, 'c+');
  if (!$fh) return false;
  flock($fh, LOCK_EX);
  $raw = stream_get_contents($fh);
  $hits = $raw ? json_decode($raw, true) : [];
  if (!is_array($hits)) $hits = [];

  $now = time();
  $hits = array_values(array_filter($hits, fn($t) => $now - $t < NO_GEMINI_WINDOW_SECONDS));
  $hits[] = $now;

  ftruncate($fh, 0);
  rewind($fh);
  fwrite($fh, json_encode($hits));
  flock($fh, LOCK_UN);
  fclose($fh);

  return count($hits) > NO_GEMINI_MAX_PER_WINDOW;
}

function no_gemini_origin_ok($origin, $referer, array $allowed) {
  $val = $origin ?: $referer;
  if (!$val) return false;
  foreach ($allowed as $a) {
    if ($val === $a || str_starts_with($val, $a . '/')) return true;
  }
  return false;
}

/** Returns [status, bodyArrayOrNull]. Transport-agnostic, mirrors the Node core. */
function no_gemini_handle(string $method, string $origin, string $referer, string $rawBody, string $ip): array {
  if ($method === 'OPTIONS') return [204, null];
  if ($method !== 'POST')    return [405, ['error' => 'Method not allowed']];

  $cfg = no_gemini_config();

  if (!no_gemini_origin_ok($origin, $referer, $cfg['allow']))
    return [403, ['error' => 'Forbidden']];

  if (!$cfg['key'])
    return [500, ['error' => 'Server is missing GEMINI_API_KEY']];

  if (strlen($rawBody) > NO_GEMINI_MAX_BYTES)
    return [413, ['error' => 'Payload too large']];

  if (no_gemini_rate_limited($ip ?: 'unknown'))
    return [429, ['error' => 'Too many requests — try again shortly']];

  $payload = json_decode($rawBody, true);
  if (json_last_error() !== JSON_ERROR_NONE)
    return [400, ['error' => 'Malformed JSON']];

  // Forward only the fields the page is allowed to set.
  $safe = [];
  if (isset($payload['contents']))          $safe['contents'] = $payload['contents'];
  if (isset($payload['generationConfig']))  $safe['generationConfig'] = $payload['generationConfig'];
  if (isset($payload['systemInstruction'])) $safe['systemInstruction'] = $payload['systemInstruction'];
  if (!isset($safe['contents'])) return [400, ['error' => 'Missing contents']];

  $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
       . rawurlencode($cfg['model']) . ':generateContent';

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($safe),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'x-goog-api-key: ' . $cfg['key']],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
  ]);
  $resp = curl_exec($ch);
  $err  = curl_error($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($resp === false) return [502, ['error' => 'Upstream request failed: ' . $err]];

  $data = json_decode($resp, true);
  if (json_last_error() !== JSON_ERROR_NONE) return [502, ['error' => 'Upstream returned malformed JSON']];

  // Pass Google's shape straight through — the page already parses it.
  return [$code >= 200 && $code < 300 ? 200 : $code, $data];
}
