<?php
/* Temporary — deleted once the Hostinger PHP proxy is confirmed working.
   Reveals no secrets: only whether PHP runs, its version, and whether an
   environment variable is VISIBLE to it (never its value). */
header('Content-Type: application/json');
header('X-Robots-Tag: noindex');
echo json_encode([
  'php_running'   => true,
  'php_version'   => phpversion(),
  'sapi'          => php_sapi_name(),
  'curl_available'=> function_exists('curl_init'),
  'getenv_sees_test_var' => getenv('PROBE_TEST') !== false,
  'env_superglobal_sees_test_var' => isset($_ENV['PROBE_TEST']),
  'tmp_dir_writable' => is_writable(sys_get_temp_dir()),
], JSON_PRETTY_PRINT);
