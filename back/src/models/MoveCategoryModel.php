<?php

namespace back\models;

use \PDO;
use stdClass;
use back\utils\{HttpException};

class MoveCategoryModel extends SqlConnect {
  private $table = "move_category";
  public $authorized_fields_to_update = ['name'];

  /*========================= ADD ===========================================*/

  public function add(array $data) {
    $query = "SELECT name FROM $this->table WHERE name = :name";
    $req = $this->db->prepare($query);
    $req->execute(["name" => $data["name"]]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("Move Category already exists!", 400);
    }

    $query = "
      INSERT INTO $this->table (name)
      VALUES (:name)
    ";

    $req = $this->db->prepare($query);
    $req->execute($data);
  }

  /*========================= GET ===========================================*/

  public function get(int $id) {
    $query = "SELECT * FROM $this->table WHERE id = :id";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Move Category doesn't exists !", 400);
    }

    $req = $this->db->prepare("SELECT * FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);

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
      throw new HttpException("No move categories !", 400);
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
      throw new HttpException("Move Category doesn't exists !", 400);
    }

    $res = $req->fetch(PDO::FETCH_ASSOC);
    $deletedMoveCategoryName = $res['name'];

    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);
    return [
      'message' => 'Move Category ' . $deletedMoveCategoryName . ' successfully removed !',
    ];
  }
}