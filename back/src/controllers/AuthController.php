<?php 

namespace back\controllers;

use Exception;
use back\controllers\Controller;
use back\models\AuthModel;
use back\utils\{Route, HttpException};
use App\Middlewares\{AuthMiddleware,Roles,RoleMiddleware};

class AuthController extends Controller {
  protected object $auth;

  public function __construct($params) {
    $this->auth = new AuthModel();
    parent::__construct($params);
  }

 /*========================= REGISTER =======================================*/

  #[Route("POST", "/back/auth/register",
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

  #[Route("POST", "/back/auth/login")]
  public function login() {
    try {
      $data = $this->body;
      if (empty($data['username']) || empty($data['password_hash'])) {
        throw new HttpException(
          "Missing username or password.", 400);
      }
      $token = $this->auth->login($data['username'], $data['password_hash']);
      return $token;
    } catch (Exception $e) {
      throw new HttpException($e->getMessage(), 401);
    }
  }

 /*========================= LOGOUT =========================================*/

  #[Route("POST", "/back/auth/logout")]
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
}