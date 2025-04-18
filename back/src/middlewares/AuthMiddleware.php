<?php 

namespace App\Middlewares;

use App\Utils\JWT;

class AuthMiddleware {
    public function handle(&$request) {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            return $this->unauthorizedResponse();
        }

        $authHeader = $headers['Authorization'];

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $this->unauthorizedResponse();
        }

        $jwt = $matches[1];

        if (!JWT::verify($jwt)) {
            return $this->unauthorizedResponse();
        }

        return true;
    }

    private function unauthorizedResponse() {
        echo json_encode(['error' => "Unauthorized"]);
        http_response_code(401);
        return false;
    }
}