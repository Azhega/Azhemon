<?php 

namespace back\controllers;

require_once __DIR__ . "/../utils/Config.php";

use Exception;
use back\controllers\Controller;
use back\models\AuthModel;
use back\utils\{Route, HttpException, JWT};
use back\middlewares\{AuthMiddleware,Roles,RoleMiddleware};

class AuthController extends Controller {
  protected object $auth;

  public function __construct($params) {
    $this->auth = new AuthModel();
    parent::__construct($params);
  }

 /*========================= REGISTER =======================================*/

  #[Route("POST", "/auth/register",
  /*middlewares: [AuthMiddleware::class, 
  [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function register() {
    try {
      $data = $this->body;
      if (empty($data['username']) || empty($data['password_hash'])) {
        throw new HttpException("Missing username or password.", 400);
      }
      $user = $this->auth->register($data);
      return $user;
    } catch (Exception $e) {
      throw new HttpException($e->getMessage(), 400);
    }
  }

 /*========================= LOGIN ==========================================*/

  #[Route("POST", "/auth/login")]
  public function login() {
    try {
      $data = $this->body;
      if (empty($data['username']) || empty($data['password_hash'])) {
        throw new HttpException(
          "Missing username or password.", 400);
      }

      $accessToken = $this->auth->login($data['username'], $data['password_hash']);
      return $accessToken;

    } catch (Exception $e) {
      throw new HttpException($e->getMessage(), 401);
    }
  }

 /*========================= LOGOUT =========================================*/

  #[Route("POST", "/auth/logout")]
  public function logout() {
    try {
      $success = $this->auth->logout();
      
      if ($success) {
        header('Content-Type: application/json');
        return ['success' => true, 'message' => 'Disconnection Successful'];
      } else {
        throw new Exception("Disconnection error.");
      }
    } catch (Exception $e) {
      header('HTTP/1.1 500 Internal Server Error');
      header('Content-Type: application/json');
      return ['success' => false, 'message' => 'Disconnection Failed'];
    }
  }

  /*========================= REFRESH ========================================*/

  #[Route("POST", "/auth/refresh")]
  public function refresh() {
    if (!isset($_COOKIE['refresh_token'])) {
      http_response_code(400);
      return ['error' => 'Missing refresh token'];
    }

    $refreshToken = $_COOKIE['refresh_token'];

    try {
      JWT::initialize(JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE);
      $payload = JWT::verify($refreshToken);
      
      if (!isset($payload['type']) || $payload['type'] !== 'refresh') {
        throw new Exception("This token is not a refresh token.");
      }

      $issuedAt = time();
      $jti = bin2hex(random_bytes(16));
      $newPayload = [
        'jti'       => $jti,
        'iss'      => JWT_ISSUER,      
        'aud'      => JWT_AUDIENCE,
        'iat'      => $issuedAt,
        'exp'      => $issuedAt + ACCESS_TOKEN_EXPIRATION,
        'sub'      => $payload['sub'],
        'username' => $payload['username'],
        'role_id'  => $payload['role_id'],
        'role'     => $payload['role']
      ];

      $newAccessToken = JWT::generate($newPayload);

      return [
        'access_token'  => $newAccessToken, 
        'user_id'       => $payload['sub'],
        'username'      => $payload['username'], 
        'role_id'       => $payload['role_id'],
        'role'          => $payload['role'],
        'message'       => 'Token refreshed.'
      ];

    } catch (Exception $e) {
      throw new HttpException($e->getMessage(), 401);
    }
  }

  /*========================= VERIFY TOKEN ===================================*/

  #[Route("GET", "/auth/verify", middlewares: [AuthMiddleware::class])]
  public function verify() {
    // The AuthMiddleware has already verified the token and populated $this->params with user data
    $userData = $this->params['user'] ?? null;
    
    if (!$userData) {
      throw new HttpException("User data not found in request", 500);
    }
    
    // Return user information from the verified token
    return [
      'user_id'   => $userData['sub'],
      'username'  => $userData['username'],
      'role_id'   => $userData['role_id'],
      'role'      => $userData['role'],
      'message'   => 'Token is valid'
    ];
  }
}