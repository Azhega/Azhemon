<?php

namespace App\Models;

use \PDO;
use stdClass;

class ReturnModel extends SqlConnect {
  private $table = "returns";
  public $authorized_fields_to_update = ['product_id', 'user_id', 'reason_id', 'status_id'];

  public function add(array $data) {
    $query = "
      INSERT INTO $this->table (product_id, user_id, reason_id)
      VALUES (:product_id, :user_id, :reason_id)
    ";

    $req = $this->db->prepare($query);
    $req->execute($data);
  }

  public function delete(int $id) {
    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);
    return new stdClass();
  }

  public function get(int $id) {
    $req = $this->db->prepare("SELECT * FROM $this->table WHERE id = :id");
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
    
    return $req->fetchAll(PDO::FETCH_ASSOC);
  }

  public function getLast() {
    $req = $this->db->prepare("SELECT * FROM $this->table ORDER BY id DESC LIMIT 1");
    $req->execute();

    return $req->rowCount() > 0 ? $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  public function update(array $data, int $id) {
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