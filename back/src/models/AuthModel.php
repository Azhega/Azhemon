<?php

namespace back\models;

use back\models\SqlConnect;
use back\utils\{HttpException, JWT};
use \PDO;
use \Exception;

class AuthModel extends SqlConnect {
  private string $table  = "player";
  private int $tokenValidity = 3600;
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
      'name' => 'admin'
    ]);
    $role = $reqRole->fetch(PDO::FETCH_ASSOC);
    var_dump($role);
    $roleId = $role['id'];
    
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

    // Generate the JWT token
    $token = $this->generateJWT($userId, $roleId);

    return [
      'message' => 'Registration success for ' . $data['username'] . ' !',
      'token' => $token
    ];
  }

  /*========================= LOGIN =========================================*/

  public function login($username, $password) {
    $query = "SELECT player.*, role.name FROM $this->table 
      JOIN role ON player.role_id = role.id WHERE player.username = :username";
    $req = $this->db->prepare($query);
    $req->execute(['username' => $username]);

    $user = $req->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if (password_verify($password, $user['password_hash'])) {
          $token = $this->generateJWT($user['id'], $user['role_id']);

          return [
            'message' => 'Login successful !',
            'token' => $token, 
            'username' => $username,
            'user_id' => $user['id'], 
            'role_id' => $user['role_id']
          ];
        }
        throw new HttpException("Wrong password", 401);
    }
  }

  /*========================= LOGOUT =========================================*/

  public function logout() {
    setcookie('token', '', [
      'expires'  => time() - 3600,
      'path'     => '/',
      'secure'   => false,
      'httponly' => true,
      'samesite' => 'Strict'
    ]);

    return true;
  }

  /*========================= JWT  ==========================================*/

  private function generateJWT(int $userId, int $role) {
    $payload = [
      'id' => $userId,
      'role' => $role,
      'exp' => time() + $this->tokenValidity
    ];
    return JWT::generate($payload);
  }
}