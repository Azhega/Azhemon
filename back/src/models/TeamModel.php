<?php

namespace back\models;

use \PDO;
use stdClass;
use back\utils\{HttpException};

class TeamModel extends SqlConnect {
  private $table = "team";
  public $authorized_fields_to_update = ['player_id', 'name'];

  /*========================= ADD ===========================================*/

  public function add(array $data) {
    $query = "
      INSERT INTO $this->table (player_id, name)
      VALUES (:player_id, :name)
    ";

    $req = $this->db->prepare($query);
    $req->execute($data);
  }

  /*======================= CREATE COMPLETE TEAM =============================*/

  public function createCompleteTeam(array $data) {
    $query1 = "
      INSERT INTO $this->table (player_id, name)
      VALUES (:player_id, :name)
    ";

    $req = $this->db->prepare($query1);
    $req->execute([
      "player_id" => $data["player_id"], 
      "name" => $data["name"]
    ]);

    $teamId = $this->db->lastInsertId();

    foreach ($data["pokemons"] as $pokemon) {
      $query2 = "
        INSERT INTO team_pokemon (team_id, slot, pokemon_species, ability, item, nature)
        VALUES (:team_id, :slot, :pokemon_species, :ability, :item, :nature)
      ";

      $req = $this->db->prepare($query2);
      $req->execute([
        "team_id" => $teamId,
        "slot" => $pokemon["slot"],
        "pokemon_species" => $pokemon["pokemon_species"],
        "ability" => $pokemon["ability"],
        "item" => $pokemon["item"],
        "nature" => $pokemon["nature"]
      ]);

      $teamPokemonId = $this->db->lastInsertId();

      foreach ($pokemon["moves"] as $move) {
      if (isset($move["move"]) && $move["move"] !== null) {
        $query3 = "
          INSERT INTO team_pokemon_move (team_pokemon_id, move, slot)
          VALUES (:team_pokemon_id, :move, :slot)
        ";

        $req = $this->db->prepare($query3);
        $req->execute([
          "team_pokemon_id" => $teamPokemonId,
          "move" => $move["move"],
          "slot" => $move["slot"]
        ]);
      }
      }
    }
  }

  /*========================= GET ===========================================*/

  public function get(int $id) {
    $query = "SELECT * FROM $this->table WHERE id = :id";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Team doesn't exists !", 400);
    }

    $req = $this->db->prepare("SELECT * FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);

    return $req->rowCount() > 0 ? 
      $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*========================= GET BY NAME ====================================*/

  public function getByName(string $username) {
    $query = "
    SELECT team.id, team.name FROM $this->table 
    JOIN player
    ON team.player_id = player.id
    WHERE player.username = :username";
    $req = $this->db->prepare($query);
    $req->execute(["username" => $username]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Team doesn't exists !", 400);
    }

    $req = $this->db->prepare($query);
    $req->execute(["username" => $username]);

    return $req->rowCount() > 0 ? 
      $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*========================= GET BY PLAYER ID ===============================*/

  public function getByPlayerId(int $id) {
    $query = "
      SELECT team.id, team.name FROM $this->table 
      JOIN player
      ON team.player_id = player.id
      WHERE player.id = :id
    ";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);

    // No error handling here, player may not have a team

    return $req->fetchAll(PDO::FETCH_ASSOC);
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
      throw new HttpException("No teams !", 400);
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

  /*========================= UPDATE COMPLETE TEAM ===========================*/

  public function updateCompleteTeam(array $data, int $id) {
    $query1 = "
      UPDATE $this->table
      SET player_id = :player_id, name = :name
      WHERE id = :id
    ";

    $req = $this->db->prepare($query1);
    $req->execute([
      "player_id" => $data["player_id"],
      "name" => $data["name"],
      "id" => $id
    ]);

    // Delete existing team_pokemon entries for the team
    $query2 = "DELETE FROM team_pokemon WHERE team_id = :team_id";
    $req = $this->db->prepare($query2);
    $req->execute(["team_id" => $id]);

    // Re-insert updated team_pokemon entries
    foreach ($data["pokemons"] as $pokemon) {
      $query3 = "
      INSERT INTO team_pokemon (team_id, slot, pokemon_species, ability, item, nature)
      VALUES (:team_id, :slot, :pokemon_species, :ability, :item, :nature)
      ";

      $req = $this->db->prepare($query3);
      $req->execute([
      "team_id" => $id,
      "slot" => $pokemon["slot"],
      "pokemon_species" => $pokemon["pokemon_species"],
      "ability" => $pokemon["ability"],
      "item" => $pokemon["item"],
      "nature" => $pokemon["nature"]
      ]);

      $teamPokemonId = $this->db->lastInsertId();

      // Delete existing moves for the team_pokemon
      $query4 = "DELETE FROM team_pokemon_move WHERE team_pokemon_id = :team_pokemon_id";
      $req = $this->db->prepare($query4);
      $req->execute(["team_pokemon_id" => $teamPokemonId]);

      // Re-insert updated moves for the team_pokemon
      foreach ($pokemon["moves"] as $move) {
        if ($move["move"] !== null) {
          $query5 = "
            INSERT INTO team_pokemon_move (team_pokemon_id, move, slot)
            VALUES (:team_pokemon_id, :move, :slot)
          ";

          $req = $this->db->prepare($query5);
          $req->execute([
            "team_pokemon_id" => $teamPokemonId,
            "move" => $move["move"],
            "slot" => $move["slot"]
          ]);
        }
      }
    }
  }

  /*========================= UPDATE =========================================*/

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
    $query = "
      SELECT team.id, player.username AS username
      FROM team
      JOIN player
      ON team.player_id = player.id
      WHERE team.id = :id;
    ";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Team doesn't exists !", 400);
    }

    $res = $req->fetch(PDO::FETCH_ASSOC);
    $deletedTeamName = $res['username'];
    $deletedTeamID = $res['id'];

    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);
    return [
      'message' => 'Team ' . $deletedTeamName . " : ID " . $deletedTeamID . ' successfully removed !',
    ];
  }
}