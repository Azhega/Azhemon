<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
echo json_encode(['status' => 'PHP is working!', 'php_version' => phpversion()]);

echo "<h1>Debug API</h1>";
echo "<p>Répertoire actuel : " . __DIR__ . "</p>";
echo "<p>Fichiers dans le répertoire :</p>";
echo "<pre>";
print_r(scandir('.'));
echo "</pre>";
echo "<p>Variables serveur :</p>";
echo "<pre>";
print_r($_SERVER);
echo "</pre>";