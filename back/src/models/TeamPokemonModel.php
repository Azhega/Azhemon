<?php

namespace back\models;

use \PDO;
use stdClass;
use back\utils\{HttpException};

class TeamPokemonModel extends SqlConnect {
  private $table = "team_pokemon";
  public $authorized_fields_to_update = [
    'team_id', 'slot', 'pokemon_species_id', 
    'ability_id', 'item_id', 'nature_id'
  ];

  /*========================= ADD ===========================================*/

  public function add(array $data) {
    if ($data['slot'] < 1 || $data['slot'] > 6) {
      throw new HttpException("Slot must be between 1 and 6.", 400);
    }

    $query = "SELECT COUNT(*) as nb FROM team_pokemon WHERE team_id = :team_id";
    $stmt = $this->db->prepare($query);
    $stmt->execute(['team_id' => $data["team_id"]]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['nb'] >= 6) {
        throw new HttpException("A team can only contain a maximum of 6 Pokemon.", 400);
    }

    $query = "
      SELECT * FROM $this->table 
      WHERE team_id = :team_id AND slot = :slot
    ";
    $req = $this->db->prepare($query);
    $req->execute([
      "team_id" => $data["team_id"],
      "slot" => $data["slot"],
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("Slot Already taken !", 400);
    }

    $query = "
      INSERT INTO $this->table 
      (team_id, slot, pokemon_species_id, ability_id, item_id, nature_id)
      VALUES 
      (:team_id, :slot, :pokemon_species_id, :ability_id, :item_id, :nature_id)
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
      throw new HttpException("Team Pokemon doesn't exists !", 400);
    }

    $req = $this->db->prepare("SELECT * FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);

    return $req->rowCount() > 0 ? 
      $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*===================== GET ALL TEAM POKEMON BY TEAM ID ====================*/

  public function getByTeamID(int $id) {
    $query = "
      SELECT 
        team_pokemon.slot, 
        team_pokemon.id,  
        pokemon_species.name AS pokemon_name, 
        ability.name AS ability_name, 
        item.name AS item_name, 
        nature.name AS nature_name
      FROM $this->table 
      JOIN team
      ON team_pokemon.team_id = team.id
      JOIN pokemon_species
      ON team_pokemon.pokemon_species_id = pokemon_species.id
      JOIN ability
      ON team_pokemon.ability_id = ability.id
      JOIN item
      ON team_pokemon.item_id = item.id
      JOIN nature
      ON team_pokemon.nature_id = nature.id
      WHERE team.id = :id
      ORDER BY slot ASC
    ";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("No Pokemons in team !", 400);
    }

    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);

    return $req->rowCount() > 0 ? 
      $req->fetchAll(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*========= GET TEAM POKEMON BY TEAM ID AND TEAM POKEMON SLOT===============*/

  public function getByTeamIDAndSlot(int $id, int $slot) {
    $query = "
      SELECT team_pokemon.id,  
        pokemon_species.name AS pokemon_name, 
        ability.name AS ability_name, 
        item.name AS item_name, 
        nature.name AS nature_name
      FROM $this->table 
      JOIN team
      ON team_pokemon.team_id = team.id
      JOIN pokemon_species
      ON team_pokemon.pokemon_species_id = pokemon_species.id
      JOIN ability
      ON team_pokemon.ability_id = ability.id
      JOIN item
      ON team_pokemon.item_id = item.id
      JOIN nature
      ON team_pokemon.nature_id = nature.id
      WHERE team.id = :id AND team_pokemon.slot = :slot
    ";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id, "slot" => $slot]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("No Pokemons in team !", 400);
    }

    $req = $this->db->prepare($query);
    $req->execute(["id" => $id, "slot" => $slot]);

    return $req->rowCount() > 0 ? 
      $req->fetch(PDO::FETCH_ASSOC) : new stdClass();
  }

  /*================= GET ALL TEAM POKEMON BY PLAYER ID ======================*/

  public function getByPlayerID(int $id) {
    $query = "
      SELECT 
        team.id AS team_id, 
        team.name AS team_name, 
        team_pokemon.slot, 
        team_pokemon.id,  
        pokemon_species.name AS pokemon_name, 
        ability.name AS ability_name, 
        item.name AS item_name, 
        nature.name AS nature_name
      FROM $this->table 
      JOIN team
      ON team_pokemon.team_id = team.id
      JOIN pokemon_species
      ON team_pokemon.pokemon_species_id = pokemon_species.id
      JOIN ability
      ON team_pokemon.ability_id = ability.id
      JOIN item
      ON team_pokemon.item_id = item.id
      JOIN nature
      ON team_pokemon.nature_id = nature.id
      JOIN player
      ON team.player_id = player.id
      WHERE player.id = :id
      ORDER BY slot ASC
    ";

    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    $results = $req->fetchAll(PDO::FETCH_ASSOC);

    if ($req->rowCount() == 0) {
      throw new HttpException("No Pokemons in team !", 400);
    }

    $teams = [];

    foreach ($results as $row) {
      $teamName = $row['team_name'];
      $teamID = $row['team_id'];

      if (!isset($teams[$teamName])) {
        $teams[$teamName] = [
          "id"       => $teamID,
          "name"     => $teamName,
          "pokemons" => []
        ];
      }

      unset($row['team_name']);
      unset($row['team_id']);

      $teams[$teamName]["pokemons"][] = $row;
    }

    $structuredResult = array_values($teams);

    return $structuredResult;
  }

  /*========== GET TEAM POKEMON BY PLAYER ID AND TEAM NAME ===================*/

  public function getByPlayerIDAndTeamName(int $playerID, string $teamName) {
    $query = "
      SELECT 
        team.id AS team_id,
        team.name AS team_name,
        team_pokemon.slot,
        team_pokemon.id AS team_pokemon_id,
        pokemon_species.name AS pokemon_name, 
        ability.name AS ability_name, 
        item.name AS item_name, 
        nature.name AS nature_name
      FROM team_pokemon
      JOIN team ON team_pokemon.team_id = team.id
      JOIN pokemon_species ON team_pokemon.pokemon_species_id = pokemon_species.id
      JOIN ability ON team_pokemon.ability_id = ability.id
      JOIN item ON team_pokemon.item_id = item.id
      JOIN nature ON team_pokemon.nature_id = nature.id
      JOIN player ON team.player_id = player.id
      WHERE player.id = :player_id
        AND team.name = :team_name
      ORDER BY team_pokemon.slot ASC
    ";
    
    $stmt = $this->db->prepare($query);
    $stmt->execute([
      "player_id"   => $playerID,
      "team_name" => $teamName
    ]);
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($results) === 0) {
      throw new HttpException("Team not found or no Pokémons in team!", 400);
    }

    $team = [
      "id"       => $results[0]["team_id"],
      "name"     => $results[0]["team_name"],
      "pokemons" => []
    ];

    foreach($results as $row) {
      $pokemon = [
        "slot"          => $row["slot"],
        "id"            => $row["team_pokemon_id"],
        "pokemon_name"  => $row["pokemon_name"],
        "ability_name"  => $row["ability_name"],
        "item_name"     => $row["item_name"],
        "nature_name"   => $row["nature_name"]
      ];
      $team["pokemons"][] = $pokemon;
    }
    
    return $team;
  }

  /*========== GET TEAM POKEMON BY PLAYER ID  AND TEAM ID AND SLOT ===========*/

  public function getByPlayerIDAndTeamNameAndSlot(
    string $playerID, string $teamName, int $slot) {
    $query = "
      SELECT 
        team.id AS team_id,
        team.name AS team_name,
        team_pokemon.slot,
        team_pokemon.id AS team_pokemon_id,
        pokemon_species.name AS pokemon_name, 
        ability.name AS ability_name, 
        item.name AS item_name, 
        nature.name AS nature_name
      FROM team_pokemon
      JOIN team ON team_pokemon.team_id = team.id
      JOIN pokemon_species ON team_pokemon.pokemon_species_id = pokemon_species.id
      JOIN ability ON team_pokemon.ability_id = ability.id
      JOIN item ON team_pokemon.item_id = item.id
      JOIN nature ON team_pokemon.nature_id = nature.id
      JOIN player ON team.player_id = player.id
      WHERE player.id = :player_id
        AND team.name = :team_name
        AND team_pokemon.slot = :slot
      ORDER BY team_pokemon.slot ASC
    ";
    
    $stmt = $this->db->prepare($query);
    $stmt->execute([
      "player_id"   => $playerID,
      "team_name" => $teamName,
      "slot"   => $slot
    ]);
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
      throw new HttpException("No Pokemon found for this slot.", 404);
    }

    $response = [
      "team" => [
        "id"   => $result["team_id"],
        "name" => $result["team_name"]
      ],
      "pokemon" => [
        "slot"          => $result["slot"],
        "id"            => $result["team_pokemon_id"],
        "pokemon_name"  => $result["pokemon_name"],
        "ability_name"  => $result["ability_name"],
        "item_name"     => $result["item_name"],
        "nature_name"   => $result["nature_name"]
      ]
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
      throw new HttpException("No team Pokemons !", 400);
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
      SELECT * FROM $this->table 
      WHERE team_id = :team_id AND slot = :slot
    ";
    $req = $this->db->prepare($query);
    $req->execute([
      "team_id" => $data["team_id"],
      "slot" => $data["slot"],
    ]);
    
    if ($req->rowCount() > 0) {
      throw new HttpException("Slot Already taken !", 400);
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
      SELECT team_pokemon.team_id, team_pokemon.slot, 
      player.username AS username, pokemon_species.name AS pokemon_name
      FROM $this->table
      JOIN team
      ON team_pokemon.team_id = team.id
      JOIN player
      ON team.player_id = player.id
      JOIN pokemon_species
      ON team_pokemon.pokemon_species_id = pokemon_species.id
      WHERE team_pokemon.id = :id;
    ";
    $req = $this->db->prepare($query);
    $req->execute(["id" => $id]);
    
    if ($req->rowCount() == 0) {
      throw new HttpException("Team Pokemon doesn't exists !", 400);
    }

    $res = $req->fetch(PDO::FETCH_ASSOC);
    $deletedTeamPokemonName = $res['pokemon_name'];
    $deletedTeamPokemonPlayerName = $res['username'];
    $deletedTeamPokemonTeamID = $res['team_id'];
    $deletedTeamPokemonSlot = $res['slot'];

    $req = $this->db->prepare("DELETE FROM $this->table WHERE id = :id");
    $req->execute(["id" => $id]);
    return [
      'message' => 
      'Team Pokemon : (Pokemon : ' . $deletedTeamPokemonName 
      . ", Player : " . $deletedTeamPokemonPlayerName 
      . ", Team ID : " . $deletedTeamPokemonTeamID 
      . ", Slot : " . $deletedTeamPokemonSlot
      . ') successfully removed !',
    ];
  }
}