<?php

namespace back\models;

use \PDO;
use stdClass;
use back\utils\{HttpException};

class TeamPokemonMoveModel extends SqlConnect {
  private $table = "team_pokemon_move";
  public $authorized_fields_to_update = ['team_pokemon_id', 'move_id', 'slot'];

  /*========================= ADD ===========================================*/

  public function add(array $data) {
    $query = "
      SELECT team_pokemon_id, move_id
      FROM $this->table
      WHERE team_pokemon_id = :team_pokemon_id 
      AND move_id = :move_id;
    ";
    $req = $this->db->prepare($query);
    $req->execute([
      "team_pokemon_id" => $data['team_pokemon_id'],
      "move_id" => $data['move_id']
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("This Pokemon already has this move !", 400);
    }

    $query = "
      SELECT team_pokemon_id, slot
      FROM $this->table
      WHERE team_pokemon_id = :team_pokemon_id 
      AND slot = :slot;
    ";
    $req = $this->db->prepare($query);
    $req->execute([
      "team_pokemon_id" => $data['team_pokemon_id'],
      "slot" => $data['slot']
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("This slot is already taken !", 400);
    }

    $query = "
      INSERT INTO $this->table (team_pokemon_id, move_id, slot)
      VALUES (:team_pokemon_id, :move_id, :slot)
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
      throw new HttpException("Team Pokemon Move doesn't exists !", 400);
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
      throw new HttpException("No Team Pokemon Moves !", 400);
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
    $query = "
      SELECT team_pokemon_id, move_id
      FROM $this->table
      WHERE team_pokemon_id = :team_pokemon_id 
      AND move_id = :move_id;
    ";
    $req = $this->db->prepare($query);
    $req->execute([
      "team_pokemon_id" => $data['team_pokemon_id'],
      "move_id" => $data['move_id']
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("This Pokemon already has this move !", 400);
    }

    $query = "
      SELECT team_pokemon_id, slot
      FROM $this->table
      WHERE team_pokemon_id = :team_pokemon_id 
      AND slot = :slot;
    ";
    $req = $this->db->prepare($query);
    $req->execute([
      "team_pokemon_id" => $data['team_pokemon_id'],
      "slot" => $data['slot']
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("This slot is already taken !", 400);
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
      SELECT team_pokemon_move.slot AS move_slot, team_pokemon.team_id, team_pokemon.slot AS team_pokemon_slot, 
      player.username AS username, pokemon_species.name AS pokemon_name, move.name AS move_name
      FROM $this->table
      JOIN team_pokemon
      ON team_pokemon_move.team_pokemon_id = team_pokemon.id
      JOIN team
      ON team_pokemon.team_id = team.id
      JOIN player
      ON team.player_id = player.id
      JOIN pokemon_species
      ON team_pokemon.pokemon_species_id = pokemon_species.id
      JOIN move
      ON team_pokemon_move.move_id = move.id
      WHERE team_pokemon_move.id = :id;
    ";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Team Pokemon Move doesn't exists !", 400);
    }

    $res = $req->fetch(PDO::FETCH_ASSOC);
    $deletedTeamPokemonName = $res['pokemon_name'];
    $deletedTeamPokemonPlayerName = $res['username'];
    $deletedTeamPokemonTeamID = $res['team_id'];
    $deletedTeamPokemonSlot = $res['team_pokemon_slot'];
    $deletedTeamPokemonMoveName = $res['move_name'];
    $deletedTeamPokemonMoveSlot = $res['move_slot'];

    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);
    return [
      'message' => 
      'Team Pokemon Move : (Move : ' . $deletedTeamPokemonMoveName
      . ', Move Slot : ' . $deletedTeamPokemonMoveSlot
      . ') from (Pokemon : '  . $deletedTeamPokemonName 
      . ', Player : ' . $deletedTeamPokemonPlayerName 
      . ', Team ID : ' . $deletedTeamPokemonTeamID 
      . ', Slot : ' . $deletedTeamPokemonSlot
      . ') successfully removed !',
    ];
  }
}