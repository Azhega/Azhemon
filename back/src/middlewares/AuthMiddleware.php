<?php 

namespace back\middlewares;

require_once __DIR__ . '/../utils/Config.php';

use back\utils\JWT;
use Exception;

class AuthMiddleware {
  public function handle(&$request) {
    JWT::initialize(JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE);

    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
      return $this->unauthorizedResponse("Authorization header not found");
    }

    $authHeader = $headers['Authorization'];

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
      return $this->unauthorizedResponse("Invalid Authorization header format");
    }

    $token = $matches[1];

    try {
      $payload = JWT::verify($token);
      $request['user'] = $payload;
    } catch (Exception $e) {
      return $this->unauthorizedResponse($e->getMessage());
    }

    return true;
  }

  private function unauthorizedResponse($message) {
    header("Content-Type: application/json");
    echo json_encode(['error' => $message]);
    http_response_code(401);
    return false;
  }
}