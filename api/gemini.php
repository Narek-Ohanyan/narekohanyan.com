<?php
/* Hostinger entry point. .htaccess rewrites /api/gemini here, so the page
   calling fetch("/api/gemini") never needs to know the backend changed
   from the Node adapter (api/gemini.js, used on Netlify/Vercel) to this. */

require __DIR__ . '/_gemini-core.php';

header('Content-Type: application/json');
header('X-Robots-Tag: noindex');

$origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$cfg     = no_gemini_config();

if ($origin && in_array($origin, $cfg['allow'], true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$raw    = $method === 'POST' ? (file_get_contents('php://input') ?: '') : '';

// XFF can list multiple hops ("client, proxy1, proxy2"); the first is the
// original client. Best-effort like the rest of the rate limiter — a
// forged header is not something this layer can fully defend against.
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? '');
$ip = trim(explode(',', $ip)[0]);

[$status, $body] = no_gemini_handle($method, $origin, $referer, $raw, $ip);

http_response_code($status);
if ($body === null) exit;
echo json_encode($body);
