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

  /*========================= GET BY PLAYER ID ===============================*/

  public function getByPlayerID(int $playerID) {
    $query = "
      SELECT 
        team.id AS team_id,
        team.name AS team_name,
        team_pokemon.id AS team_pokemon_id,
        team_pokemon.slot AS pokemon_slot,
        pokemon_species.name AS pokemon_name,
        team_pokemon_move.slot AS move_slot,
        team_pokemon_move.id AS move_id,
        move.name AS move_name
      FROM team_pokemon_move
      JOIN team_pokemon ON team_pokemon_move.team_pokemon_id = team_pokemon.id
      JOIN team ON team_pokemon.team_id = team.id
      JOIN player ON team.player_id = player.id
      JOIN pokemon_species ON team_pokemon.pokemon_species_id = pokemon_species.id
      LEFT JOIN move ON team_pokemon_move.move_id = move.id
      WHERE player.id = :playerID
      ORDER BY team.id, team_pokemon.slot, team_pokemon_move.slot
    ";
    
    $stmt = $this->db->prepare($query);
    $stmt->execute(["playerID" => $playerID]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if(!$results){
      throw new HttpException("No data found for Player ID : $playerID", 404);
    }

    $teams = [];
    foreach($results as $row) {
      $teamId = $row['team_id'];
      if(!isset($teams[$teamId])) {
        $teams[$teamId] = [
          "id"       => $teamId,
          "name"     => $row['team_name'],
          "pokemons" => []
        ];
      }
      $pokemonId = $row['team_pokemon_id'];
      if(!isset($teams[$teamId]['pokemons'][$pokemonId])) {
        $teams[$teamId]['pokemons'][$pokemonId] = [
          "id"           => $pokemonId,
          "slot"         => $row['pokemon_slot'],
          "pokemon_name" => $row['pokemon_name'],
          "moves"        => []
        ];
      }
      $teams[$teamId]['pokemons'][$pokemonId]['moves'][] = [
        "move_id"   => $row['move_id'],
        "slot"      => $row['move_slot'],
        "move_name" => $row['move_name']
      ];
    }

    foreach($teams as &$team) {
      $team['pokemons'] = array_values($team['pokemons']);
    }
    $teams = array_values($teams);
    
    return $teams;
  }

  /*===================== GET BY PLAYER ID AND TEAM NAME =====================*/

  public function getByPlayerIDAndTeamName(int $playerID, string $teamName) {
    $query = "
      SELECT 
        team.id AS team_id,
        team.name AS team_name,
        team_pokemon.id AS team_pokemon_id,
        team_pokemon.slot AS pokemon_slot,
        pokemon_species.name AS pokemon_name,
        team_pokemon_move.slot AS move_slot,
        team_pokemon_move.id AS move_id,
        move.name AS move_name
      FROM team_pokemon_move
      JOIN team_pokemon ON team_pokemon_move.team_pokemon_id = team_pokemon.id
      JOIN team ON team_pokemon.team_id = team.id
      JOIN player ON team.player_id = player.id
      JOIN pokemon_species ON team_pokemon.pokemon_species_id = pokemon_species.id
      LEFT JOIN move ON team_pokemon_move.move_id = move.id
      WHERE player.id = :playerID
        AND team.name = :teamName
      ORDER BY team_pokemon.slot, team_pokemon_move.slot
    ";
    
    $stmt = $this->db->prepare($query);
    $stmt->execute(["playerID" => $playerID, "teamName" => $teamName]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if(!$results){
      throw new HttpException("No moves found for Player ID : $playerID and team name : '$teamName'", 404);
    }

    $team = [
      "id"       => $results[0]["team_id"],
      "name"     => $results[0]["team_name"],
      "pokemons" => []
    ];
    foreach($results as $row) {
      $pokemonId = $row['team_pokemon_id'];
      if(!isset($team['pokemons'][$pokemonId])) {
        $team['pokemons'][$pokemonId] = [
          "id"           => $pokemonId,
          "slot"         => $row['pokemon_slot'],
          "pokemon_name" => $row['pokemon_name'],
          "moves"        => []
        ];
      }
      $team['pokemons'][$pokemonId]['moves'][] = [
        "move_id"   => $row['move_id'],
        "slot"      => $row['move_slot'],
        "move_name" => $row['move_name']
      ];
    }
    $team['pokemons'] = array_values($team['pokemons']);
    
    return $team;
  }

  /*================= GET BY PLAYER ID AND TEAM NAME AND SLOT ================*/

  public function getByPlayerIDAndTeamNameAndSlot(int $playerID, string $teamName, int $pokemonSlot) {
    $query = "
      SELECT 
        team.id AS team_id,
        team.name AS team_name,
        team_pokemon.id AS team_pokemon_id,
        team_pokemon.slot AS pokemon_slot,
        pokemon_species.name AS pokemon_name,
        team_pokemon_move.slot AS move_slot,
        team_pokemon_move.id AS move_id,
        move.name AS move_name
      FROM team_pokemon_move
      JOIN team_pokemon ON team_pokemon_move.team_pokemon_id = team_pokemon.id
      JOIN team ON team_pokemon.team_id = team.id
      JOIN player ON team.player_id = player.id
      JOIN pokemon_species ON team_pokemon.pokemon_species_id = pokemon_species.id
      LEFT JOIN move ON team_pokemon_move.move_id = move.id
      WHERE player.id = :playerID
        AND team.name = :teamName
        AND team_pokemon.slot = :pokemonSlot
      ORDER BY team_pokemon_move.slot
    ";
    
    $stmt = $this->db->prepare($query);
    $stmt->execute([
      "playerID"    => $playerID,
      "teamName"    => $teamName,
      "pokemonSlot" => $pokemonSlot
    ]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if(!$results) {
        throw new HttpException("No pokemon found for Player ID : $playerID, Team : '$teamName' and slot : $pokemonSlot", 404);
    }

    $pokemon = [
      "id"           => $results[0]["team_pokemon_id"],
      "slot"         => $results[0]["pokemon_slot"],
      "pokemon_name" => $results[0]["pokemon_name"],
      "moves"        => []
    ];
    foreach($results as $row) {
      $pokemon["moves"][] = [
      "move_id"   => $row["move_id"],
      "slot"      => $row["move_slot"],
      "move_name" => $row["move_name"]
      ];
    }

    $response = [
      "team" => [
      "id"   => $results[0]["team_id"],
      "name" => $results[0]["team_name"]
      ],
      "pokemon" => $pokemon
    ];
    
    return $response;
  }

  /*========================= GET BY TEAM POKEMON ID =========================*/

  public function getByPokemonID(int $pokemonID) {
    $query = "
      SELECT 
        team_pokemon_move.slot AS move_slot,
        team_pokemon_move.id AS move_id,
        move.name AS move_name
      FROM team_pokemon_move
      LEFT JOIN move ON team_pokemon_move.move_id = move.id
      WHERE team_pokemon_move.team_pokemon_id = :pokemonID
      ORDER BY team_pokemon_move.slot
    ";
    $stmt = $this->db->prepare($query);
    $stmt->execute(["pokemonID" => $pokemonID]);
    $moves = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if(!$moves) {
      throw new HttpException("No moves found for Pokemon ID : $pokemonID", 404);
    }
    return $moves;
  }

  /*========================= GET BY TEAM ID ===============================*/

  public function getByTeamID(int $teamID) {
    $query = "
      SELECT 
        team.id AS team_id,
        team.name AS team_name,

        team_pokemon.slot AS pokemon_slot,
        team_pokemon.pokemon_species AS pokemon_name,
        team_pokemon.ability AS ability,
        team_pokemon.item AS item,
        team_pokemon.nature AS nature,

        team_pokemon_move.slot AS move_slot,
        team_pokemon_move.move AS move
      FROM team_pokemon_move
      JOIN team_pokemon ON team_pokemon_move.team_pokemon_id = team_pokemon.id
      JOIN team ON team_pokemon.team_id = team.id
      WHERE team.id = :teamID
      ORDER BY team_pokemon.slot, team_pokemon_move.slot;
    ";
    $stmt = $this->db->prepare($query);
    $stmt->execute(["teamID" => $teamID]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$results) {
      throw new HttpException("No data found for team ID : $teamID", 404);
    }

    $team = [
      "id"       => $results[0]["team_id"],
      "name"     => $results[0]["team_name"],
      "pokemons" => []
    ];

    foreach ($results as $row) {
      $uniqueKey = $row['pokemon_name'] . '-' . $row['pokemon_slot'];

      if (!isset($team['pokemons'][$uniqueKey])) {
        $team['pokemons'][$uniqueKey] = [
          "slot"         => $row['pokemon_slot'],
          "pokemon_name" => $row['pokemon_name'],
          "ability"      => $row['ability'],
          "item"         => $row['item'],
          "nature"       => $row['nature'],
          "moves"        => []
        ];
      }

      $team['pokemons'][$uniqueKey]['moves'][] = [
        "slot"        => $row['move_slot'],
        "name"        => $row['move'],
      ];
    }

    // Reset the keys to be sequential
    $team['pokemons'] = array_values($team['pokemons']);

    return $team;
  }

  /*========================= GET BY TEAM ID AND SLOT ========================*/

  public function getByTeamIdAndSlot(int $teamID, int $pokemonSlot) {
    $query = "
      SELECT 
        team.id AS team_id,
        team.name AS team_name,
        team_pokemon.id AS team_pokemon_id,
        team_pokemon.slot AS pokemon_slot,
        pokemon_species.name AS pokemon_name,
        team_pokemon_move.slot AS move_slot,
        team_pokemon_move.id AS move_id,
        move.name AS move_name
      FROM team_pokemon_move
      JOIN team_pokemon ON team_pokemon_move.team_pokemon_id = team_pokemon.id
      JOIN team ON team_pokemon.team_id = team.id
      JOIN pokemon_species ON team_pokemon.pokemon_species_id = pokemon_species.id
      LEFT JOIN move ON team_pokemon_move.move_id = move.id
      WHERE team.id = :teamID
        AND team_pokemon.slot = :pokemonSlot
      ORDER BY team_pokemon_move.slot
    ";
    $stmt = $this->db->prepare($query);
    $stmt->execute([
      "teamID"      => $teamID,
      "pokemonSlot" => $pokemonSlot
    ]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if(!$results){
        throw new HttpException("No data found for team ID : $teamID and slot : $pokemonSlot", 404);
    }

    $pokemon = [
      "id"           => $results[0]["team_pokemon_id"],
      "slot"         => $results[0]["pokemon_slot"],
      "pokemon_name" => $results[0]["pokemon_name"],
      "moves"        => []
    ];
    foreach($results as $row){
        $pokemon["moves"][] = [
          "move_id"   => $row["move_id"],
          "slot"      => $row["move_slot"],
          "move_name" => $row["move_name"]
        ];
    }
    $response = [
      "team" => [
        "id"   => $results[0]["team_id"],
        "name" => $results[0]["team_name"]
      ],
      "pokemon" => $pokemon
    ];
    
    return $response;
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