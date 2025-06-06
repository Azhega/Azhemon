<?php

namespace back\models;

use back\models\SqlConnect;
use back\utils\{HttpException, JWT};
use \PDO;
use \Exception;

require_once __DIR__ . '/../utils/Config.php';

class AuthModel extends SqlConnect {
  private string $table  = "player";
  private string $roleTable = "role";
  
  /*========================= REGISTER ======================================*/

  public function register(array $data) {
    $query = "SELECT username FROM $this->table WHERE username = :username";
    $req = $this->db->prepare($query);
    $req->execute(["username" => $data["username"]]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("User already exists!", 400);
    }

    $queryRole = "SELECT id FROM $this->roleTable WHERE name = :name";
    $reqRole = $this->db->prepare($queryRole);
    $reqRole->execute([
      'name' => 'player'
    ]);
    $role = $reqRole->fetch(PDO::FETCH_ASSOC);
    var_dump($role);
    $roleId = $role['id'];
    $roleName = $role['name'];
    
    $hashedPassword = password_hash($data["password_hash"],
      PASSWORD_BCRYPT);

    //To filter secure password on register
    if (strlen($data["password_hash"]) <= 5) {
      throw new Exception('Password must be at least 6 characters long.');
    }
    
    if (!preg_match('/[A-Z]/', $data["password_hash"])) {
      throw new Exception(
        'Password must include at least one uppercase letter.');
    }
    
    if (!preg_match('/[0-9]/', $data["password_hash"])) {
      throw new Exception('Password must include at least one number.');
    }

    if ($data['username'] == null 
    || $data['password_hash'] == null) {
      throw new Exception('Missing fields.');
    }

    // Create the user
    $addQuery = "INSERT INTO $this->table (
      username, password_hash) 
      VALUES (:username, :password_hash)";

    $req2 = $this->db->prepare($addQuery);
    $req2->execute([
      "username" => $data['username'],
      "password_hash" => $hashedPassword
    ]);

    $userId = $this->db->lastInsertId();
    $username = $data['username'];

    // Generate the JWT token
    $token = $this->generateJWT($userId, $username, $roleId, $roleName);

    return [
      'message' => 'Registration success for ' . $username . ' !',
      'token' => $token
    ];
  }

  /*========================= LOGIN =========================================*/

  public function login($username, $password) {
    $query = "SELECT player.*, role.name AS role_name FROM $this->table 
      JOIN role ON player.role_id = role.id WHERE player.username = :username";
    $req = $this->db->prepare($query);
    $req->execute(['username' => $username]);

    $user = $req->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if (password_verify($password, $user['password_hash'])) {
          $accessToken = $this->generateJWT(
            $user['id'],
            $username,  
            $user['role_id'],
            $user['role_name'],
          );

          $refreshToken = $this->generateRefreshToken(
            $user['id'],
            $username,  
            $user['role_id'],
            $user['role_name'],
          );

          setcookie("refresh_token", $refreshToken, [
            'expires'   => time() + REFRESH_TOKEN_EXPIRATION,
            'path'      => '/',
            'domain'    => '',
            'secure'    => false, //true pour https en prod
            'httponly'  => true,
            'samesite'  => 'Lax' // Better compatibility than 'Strict'
          ]);

          return [
            'message'       => 'Login successful !',
            'access_token'  => $accessToken, 
            'user_id'       => $user['id'],
            'username'      => $username,
            'role_id'       => $user['role_id'],
            'role'          => $user['role_name']
          ];
        }
        throw new HttpException("Wrong password", 401);
    }
  }

  /*========================= LOGOUT =========================================*/

  public function logout() {
    $headers = getallheaders();

    if (!isset($headers['Authorization'])) {
      throw new Exception("Authorization header not found");
    }

    $authHeader = $headers['Authorization'];

    if (!isset($headers['Authorization']) 
    || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
      throw new HttpException("Access Token missing.", 400);
    }

    $accessToken = $matches[1];

    try {
      JWT::initialize(JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE);
      $payload = JWT::verify($accessToken);
      
      if (isset($payload['jti'])) {
        $this->revokeToken($payload['jti']);
      }
    } catch (Exception $e) {
      //Continue even if verification fails (token already expired or invalid)
    }

    setcookie('refresh_token', '', [
      'expires'  => time() - 3600,
      'path'     => '/',
      'domain'    => '',
      'secure'   => false,
      'httponly' => true,
      'samesite' => 'Lax' // Better compatibility than 'Strict'
    ]);

    return true;
  }

  /*========================= GENERATE JWT ===================================*/

  private function generateJWT(int $userId, $username, int $roleId, $role) {
    $issuedAt = time();
    $jti = bin2hex(random_bytes(16));
    $payload = [
      'jti'       => $jti,
      'iss'       => JWT_ISSUER,
      'aud'       => JWT_AUDIENCE,
      'iat'       => $issuedAt,
      'exp'       => $issuedAt + ACCESS_TOKEN_EXPIRATION,
      'sub'       => $userId,
      'username'  => $username,
      'role_id'   => $roleId,
      'role'      => $role
    ];
    JWT::initialize(JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE);
    return JWT::generate($payload);
  }

  /*========================= REFRESH TOKEN ==================================*/

  private function generateRefreshToken(int $userId, $username, int $roleId, $role) {
    $issuedAt = time();
    $payload = [
      'iss'       => JWT_ISSUER,
      'aud'       => JWT_AUDIENCE,
      'iat'       => $issuedAt,
      'exp'       => $issuedAt + REFRESH_TOKEN_EXPIRATION,
      'sub'       => $userId,
      'username'  => $username,
      'role_id'   => $roleId,
      'role'      => $role,
      'type'      => 'refresh'
    ];
    JWT::initialize(JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE);
    return JWT::generate($payload);
  }

  /*========================= TOKEN BLACKLIST ================================*/

  public function isTokenRevoked($jti) {
    $stmt = $this->db->prepare("
      SELECT COUNT(*) as count FROM revoked_token WHERE jti = :jti
    ");
    $stmt->execute(['jti' => $jti]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return ($result['count'] > 0);
  }

  public function revokeToken($jti) {
    $stmt = $this->db->prepare("INSERT INTO revoked_token (jti, revoked_at) VALUES (:jti, NOW())");
    return $stmt->execute(['jti' => $jti]);
  }
}