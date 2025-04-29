<?php

namespace back\models;

use \PDO;
use stdClass;
use \Exception;
use back\utils\{HttpException};

class PlayerModel extends SqlConnect {
  private $table = "player";
  public $authorized_fields_to_update = [
    'username', 'password_hash', 'role_id'
  ];

  /*========================= ADD ===========================================*/

  public function add(array $data) {
    $query = "SELECT username FROM $this->table 
      WHERE username = :username";
    $req = $this->db->prepare($query);
    $req->execute(["username" => $data["username"]]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("User already exists!", 400);
    }

    //To filter secure password on player add
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

    $hashedPassword = password_hash($data["password_hash"],
      PASSWORD_BCRYPT);

    //No role_id in insert to prevent adding admin user by mistake
    $query = "
      INSERT INTO $this->table (username, password_hash)
      VALUES (:username, :password_hash)
    ";

    $req = $this->db->prepare($query);
    $req->execute([
      "username" => $data['username'],
      "password_hash" => $hashedPassword
    ]);
  }

  /*========================= GET BY ID =====================================*/

  public function get(int $id) {
    $query = "SELECT * FROM $this->table WHERE id = :id";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Player doesn't exists !", 400);
    }

    $req = $this->db->prepare("SELECT * FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);

    return $req->rowCount() > 0 ? 
      $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*========================= GET BY NAME ====================================*/

  public function getByName(string $username) {
    $query = "SELECT * FROM $this->table WHERE username = :username";
    $req = $this->db->prepare($query);
    $req->execute(["username" => $username]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Player doesn't exists !", 400);
    }

    $req = $this->db->prepare("SELECT * FROM $this->table WHERE username = :username");
    $req->execute(["username" => $username]);

    return $req->rowCount() > 0 ? 
      $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*========================= GET ALL =======================================*/

  public function getAll(?int $limit = null) {
    $query = "SELECT * FROM {$this->table}";
    
    if ($limit !== null) {
        $query .= " LIMIT :limit";
        $params = [':limit' => (int)$limit];
    } else {
        $params = [];
    }
    
    $req = $this->db->prepare($query);
    foreach ($params as $key => $value) {
        $req->bindValue($key, $value, PDO::PARAM_INT);
    }
    $req->execute();

    if ($req->rowCount() == 0) {
      throw new HttpException("No users !", 400);
    }
    
    return $req->fetchAll(PDO::FETCH_ASSOC);
  }

  /*========================= GET LAST ======================================*/

  public function getLast() {
    $req = $this->db->prepare(
      "SELECT * FROM $this->table ORDER BY id DESC LIMIT 1");
    $req->execute();

    return $req->rowCount() > 0 ? 
      $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*========================= UPDATE ========================================*/

  public function update(array $data, int $id) {
    //To filter secure password on player add
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

    $hashedPassword = password_hash($data["password_hash"],
      PASSWORD_BCRYPT);

    $data["password_hash"] = $hashedPassword;

    $request = "UPDATE $this->table SET ";
    $params = [];
    $fields = [];

    foreach ($data as $key => $value) {
      if (in_array($key, $this->authorized_fields_to_update)) {
        $fields[] = "$key = :$key";
        $params[":$key"] = $value;
      }
    }

    $params[':id'] = $id;
    $query = $request . implode(", ", $fields) . " WHERE id = :id";

    $req = $this->db->prepare($query);
    $req->execute($params);
    
    return $this->get($id);
  }
  
  /*========================= DELETE ========================================*/

  public function delete(int $id) {
    $query = "SELECT * FROM $this->table WHERE id = :id";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Player doesn't exists !", 400);
    }

    $res = $req->fetch(PDO::FETCH_ASSOC);
    $deletedPlayerUsername = $res['username'];

    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);

    return [
      'message' => 'Player ' . $deletedPlayerUsername . ' successfully removed !',
    ];
  }
}