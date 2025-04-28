<?php

namespace back\models;

use \PDO;
use stdClass;
use back\utils\{HttpException};

class SpeciesMoveModel extends SqlConnect {
  private $table = "species_move";
  public $authorized_fields_to_update = ['pokemon_species_id', 'move_id'];

  /*========================= ADD ===========================================*/

  public function add(array $data) {
    $query = "SELECT * FROM $this->table WHERE pokemon_species_id = :pokemon_species_id AND move_id = :move_id";
    $req = $this->db->prepare($query);
    $req->execute([
      "pokemon_species_id" => $data["pokemon_species_id"],
      "move_id" => $data["move_id"]
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("Species Move already exists!", 400);
    }

    $query = "
      INSERT INTO $this->table (pokemon_species_id, move_id)
      VALUES (:pokemon_species_id, :move_id)
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
      throw new HttpException("Species Move doesn't exists !", 400);
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
      throw new HttpException("No Species Moves !", 400);
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
    $query = "SELECT * FROM $this->table WHERE pokemon_species_id = :pokemon_species_id AND move_id = :move_id";
    $req = $this->db->prepare($query);
    $req->execute([
      "pokemon_species_id" => $data["pokemon_species_id"],
      "move_id" => $data["move_id"]
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("Species Move already exists!", 400);
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

  /*========================= DELETE ========================================*/

  public function delete(int $id) {
    $query = "
      SELECT species_move.id, pokemon_species.name AS pokemon_species_name, move.name AS move_name
      FROM species_move
      JOIN pokemon_species
      ON species_move.pokemon_species_id = pokemon_species.id
      JOIN move
      ON species_move.move_id = move.id
      WHERE species_move.id = :id;
    ";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Species Move doesn't exists !", 400);
    }

    $res = $req->fetch(PDO::FETCH_ASSOC);
    $deletedSpeciesMoveName = $res['move_name'];
    $deletedSpeciesMovePokemonName = $res['pokemon_species_name'];

    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);
    return [
      'message' => 'Species Move ' . $deletedSpeciesMovePokemonName . " : " . $deletedSpeciesMoveName . ' successfully removed !',
    ];
  }
}