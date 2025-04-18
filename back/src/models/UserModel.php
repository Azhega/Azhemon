<?php

namespace App\Models;

use \PDO;
use stdClass;
use \Exception;
use App\Utils\{HttpException};

class UserModel extends SqlConnect {
  private $table = "users";
  public $authorized_fields_to_update = ['firstname', 'lastname', 'state', 'city', 'street', 'street_number', 'postal_code', 'email', 'phone_number', 'password_hash'];

  public function add(array $data) {
    $query = "SELECT email FROM $this->table WHERE email = :email";
    $req = $this->db->prepare($query);
    $req->execute(["email" => $data["email"]]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("User already exists!", 400);
    }

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

    $query = "
      INSERT INTO $this->table (firstname, lastname, state, city, street, street_number, postal_code, email, phone_number, password_hash)
      VALUES (:firstname, :lastname, :state, :city, :street, :street_number, :postal_code, :email, :phone_number, :password_hash)
    ";

    $req = $this->db->prepare($query);
    $req->execute($data);
  }

  public function delete(int $id) {
    $query = "SELECT * FROM $this->table WHERE id = :id";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("User doesn't exists !", 400);
    }

    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);
    return new stdClass();
  }

  public function get(int $id) {
    $query = "SELECT * FROM $this->table WHERE id = :id";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("User doesn't exists !", 400);
    }

    $req = $this->db->prepare("SELECT * FROM users WHERE id = :id");
    $req->execute(["id" => $id]);

    return $req->rowCount() > 0 ? $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

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

  public function getLast() {
    $req = $this->db->prepare("SELECT * FROM $this->table ORDER BY id DESC LIMIT 1");
    $req->execute();

    return $req->rowCount() > 0 ? $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  public function update(array $data, int $id) {
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
}