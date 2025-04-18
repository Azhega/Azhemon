<?php

namespace App\Models;

use App\Models\SqlConnect;
use App\Utils\{HttpException, JWT};
use \PDO;
use \Exception;

class AuthModel extends SqlConnect {
  private string $table  = "users";
  private int $tokenValidity = 3600;
  
  public function register(array $data) {
    $query = "SELECT email FROM $this->table WHERE email = :email";
    $req = $this->db->prepare($query);
    $req->execute(["email" => $data["email"]]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("User already exists!", 400);
    }

    $queryRole = "SELECT id FROM roles WHERE role_name = 'customer'";
    $reqRole = $this->db->prepare($queryRole);
    $reqRole->execute();
    $role = $reqRole->fetch(PDO::FETCH_ASSOC);
    $roleId = $role['id'];

    $hashedPassword = password_hash($data["password_hash"], PASSWORD_BCRYPT);

    if (!filter_var($data["email"], FILTER_VALIDATE_EMAIL)) { //To filter validate email on register
      throw new Exception('Invalid email format.');
    }

    //To filter secure password on register
    if (strlen($data["password_hash"]) < 8) {
      throw new Exception('Password must be at least 8 characters long.');
    }
    
    if (!preg_match('/[A-Z]/', $data["password_hash"])) {
        throw new Exception('Password must include at least one uppercase letter.');
    }
    
    if (!preg_match('/[0-9]/', $data["password_hash"])) {
        throw new Exception('Password must include at least one number.');
    }

    if ($data['firstname'] == null 
    || $data['lastname'] == null
    || $data['state'] == null
    || $data['city'] == null
    || $data['street'] == null
    || $data['street_number'] == null
    || $data['postal_code'] == null
    || $data['phone_number'] == null) {
      throw new Exception('Missing fields.');
    }


    // Create the user
    $queryAdd = "INSERT INTO $this->table (firstname, lastname, state, city, street, street_number, 
                                            postal_code, email, phone_number, password_hash, role_id) 
                                            VALUES (:firstname, :lastname, :state, :city, :street, :street_number, 
                                            :postal_code, :email, :phone_number, :password_hash, :role_id)";
    $req2 = $this->db->prepare($queryAdd);
    $req2->execute([
      "firstname" => $data['firstname'],
      "lastname" => $data['lastname'],
      "state" => $data['state'],
      "city" => $data['city'],
      "street" => $data['street'],
      "street_number" => $data['street_number'],
      "postal_code" => $data['postal_code'],
      "email" => $data["email"],
      "phone_number" => $data['phone_number'],
      "password_hash" => $hashedPassword,
      "role_id" => $roleId
    ]);

    $userId = $this->db->lastInsertId();

    // Generate the JWT token
    $token = $this->generateJWT($userId, $roleId);

    return ['token' => $token];
  }

  public function login($email, $password) {
    $query = "SELECT users.*, roles.role_name FROM $this->table JOIN roles ON users.role_id = roles.id WHERE users.email = :email";
    $req = $this->db->prepare($query);
    $req->execute(['email' => $email]);

    $user = $req->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        if (password_verify($password, $user['password_hash'])) {
          $token = $this->generateJWT($user['id'], $user['role_name']);
            return ['token' => $token];
        }
    }

    throw new \Exception("Invalid credentials.");
  }

  private function generateJWT(string $userId, string $role) {
    $payload = [
      'user_id' => $userId,
      'role' => $role,
      'exp' => time() + $this->tokenValidity
    ];
    return JWT::generate($payload);
  }
}