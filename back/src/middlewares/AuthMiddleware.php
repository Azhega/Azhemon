<?php 

namespace back\middlewares;

require_once __DIR__ . '/../utils/Config.php';

use back\utils\{JWT, HttpException};
use back\models\AuthModel;
use Exception;

class AuthMiddleware {
  private AuthModel $authModel;
  
  public function __construct() {
    $this->authModel = new AuthModel();
  }

  public function handle(&$request) {
    JWT::initialize(JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE);

    $authHeader = null;
    $headers = getallheaders();
    
    // Method 1: Standard headers
    if (isset($headers['Authorization'])) {
      $authHeader = $headers['Authorization'];
    }
    // Method 2: Apache specific environment variable
    else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
      $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    // Method 3: Apache mod_rewrite specific
    else if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
      $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    // Method 4: Manual header extraction for some hosting environments
    else if (function_exists('apache_request_headers')) {
      $apacheHeaders = apache_request_headers();
      if (isset($apacheHeaders['Authorization'])) {
        $authHeader = $apacheHeaders['Authorization'];
      }
    }

    if (!$authHeader) {
      throw new HttpException("Authorization header not found", 401);
    }

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
      throw new HttpException("Invalid Authorization header format", 401);
    }

    $token = $matches[1];

    try {
      $payload = JWT::verify($token);

      // Check if token is blacklisted
      if (isset($payload['jti']) && $this->authModel->isTokenRevoked($payload['jti'])) {
        throw new HttpException("Token has been revoked", 401);
      }

      $request['user'] = $payload;
    } catch (Exception $e) {
      if ($e instanceof HttpException) {
        throw $e;
      }
      throw new HttpException($e->getMessage(), 401);
    }

    return true;
  }
}