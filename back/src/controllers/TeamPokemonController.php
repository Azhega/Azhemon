<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\TeamPokemonModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class TeamPokemonController extends Controller {
  protected object $teamPokemon;

  public function __construct($param) {
    $this->teamPokemon = new TeamPokemonModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/team_pokemon"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createTeamPokemon() {
    $this->teamPokemon->add($this->body);

    return $this->teamPokemon->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/team_pokemon/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeamPokemon() {
    return $this->teamPokemon->get(intval($this->params['id']));
  }

  /*========================= GET ALL BY TEAM ID =============================*/

  #[Route("GET", "/back/team_pokemon/team/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getAllByTeamID() {
    return $this->teamPokemon->getByTeamID(intval($this->params['id']));
  }

  /*================ GET ALL BY TEAM ID AND SLOT =============================*/

  #[Route("GET", "/back/team_pokemon/team/:id/slot/:slot"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getByTeamIDAndSlot() {
    return $this->teamPokemon->getByTeamIDAndSlot(
      intval($this->params['id']), intval($this->params['slot']));
  }

  /*===================== GET ALL BY PLAYER ID ===============================*/

  #[Route("GET", "/back/team_pokemon/player_id/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getAllByPlayerID() {
    return $this->teamPokemon->getByPlayerID(intval($this->params['id']));
  }

  /*================ GET BY PLAYER NAME AND TEAM NAME===========================*/

  #[Route("GET", "/back/team_pokemon/player_id/:player_id/team/:team_name"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getByPlayerIDAndTeamName() {
    return $this->teamPokemon->getByPlayerIDAndTeamName(
      intval($this->params['player_id']), $this->params['team_name']);
  }

  /*================ GET BY PLAYER NAME AND TEAM ID AND SLOT==================*/

  #[Route("GET", "/back/team_pokemon/player_id/:player_id/team/:team_name/slot/:slot"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getByPlayerIDAndTeamNameAndSlot() {
    return $this->teamPokemon->getByPlayerIDAndTeamNameAndSlot(
      $this->params['player_id'], $this->params['team_name'], $this->params['slot']);
  }

  /*========================== GET ALL =======================================*/

  #[Route("GET", "/back/team_pokemon"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeamPokemons() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->teamPokemon->getAll($limit);
  }

  /*========================== PATCH =========================================*/

  #[Route("PATCH", "/back/team_pokemon/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateTeamPokemon() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->teamPokemon->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->teamPokemon->update($data, intval($id));

      # Let's return the updated teamPokemon
      return $this->teamPokemon->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/team_pokemon/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteTeamPokemon() {
    return $this->teamPokemon->delete(intval($this->params['id']));
  }
}