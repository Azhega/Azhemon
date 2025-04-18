<?php
header("Content-Type: application/json");

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Configuration de la connexion DB
$host = '127.0.0.1';       // Utilise 127.0.0.1 ou localhost selon ta config
$db   = $_ENV['DB_NAME'];;    // Remplace par le nom de ta base de données
$user = $_ENV['DB_USER'];           // Généralement 'root' sous Laragon
$pass = $_ENV['DB_PASSWORD'];               // Le mot de passe peut être vide par défaut dans Laragon
$port = $_ENV['DB_PORT'];          // Vérifie que c'est bien le port utilisé par MySQL

$dsn = "mysql:host=$host;dbname=$db;port=$port;charset=utf8";

try {
    // Créer une instance PDO
    $pdo = new PDO($dsn, $user, $pass);
    
    // On configure PDO pour lancer des exceptions en cas d'erreur
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Exemple de requête : récupérer la date actuelle depuis la base
    $stmt = $pdo->query("SELECT NOW()");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Retourne le résultat au format JSON
    echo json_encode([
        "success" => true,
        "message" => "Connexion réussie à la DB",
        "data"    => $data
    ]);
} catch (PDOException $e) {
    // Renvoyer l'erreur en format JSON en cas d'échec
    echo json_encode([
        "success" => false,
        "message" => "Erreur de connexion : " . $e->getMessage()
    ]);
}
?>
