<?php

namespace back\middlewares;

use back\utils\{JWT, HttpException};
use Exception;

class RoleMiddleware {
  private string $requiredRole;

  public function __construct(string $requiredRole) {
    $this->requiredRole = $requiredRole;
  }

  public function handle(&$request) {
    if (!isset($request['user'])) {
      $headers = getallheaders();
      if (!isset($headers['Authorization'])) {
        throw new HttpException("Authorization header not found", 401);
      }

      $authHeader = $headers['Authorization'];
      if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        throw new HttpException("Invalid Authorization header format", 401);
      }

      $jwt = $matches[1];

      try {
        $payload = JWT::verify($jwt);
        $request['user'] = $payload;
      } catch (Exception $e) {
        throw new HttpException($e->getMessage(), 401);
      }
    }

    $userRole = $request['user']['role'] ?? null;

    if ($userRole !== $this->requiredRole) {
      throw new HttpException("Insufficient permissions", 403);
    }

    return true;
  }
}