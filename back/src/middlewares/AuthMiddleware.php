<?php 

namespace back\middlewares;

require_once __DIR__ . '/../utils/Config.php';

use back\utils\JWT;
use back\models\AuthModel;
use Exception;

class AuthMiddleware {
  private AuthModel $authModel;
  
  public function __construct() {
    // AuthModel instance will automatically connect to database via SqlConnect
    $this->authModel = new AuthModel();
  }

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

      // Check if token is blacklisted
      if (isset($payload['jti']) && $this->authModel->isTokenRevoked($payload['jti'])) {
        return $this->unauthorizedResponse("Token has been revoked");
      }

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