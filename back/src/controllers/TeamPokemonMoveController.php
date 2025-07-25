<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\TeamPokemonMoveModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class TeamPokemonMoveController extends Controller {
  protected object $teamPokemonMove;

  public function __construct($param) {
    $this->teamPokemonMove = new TeamPokemonMoveModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/team_pokemon_move",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function createTeamPokemonMove() {
    $this->teamPokemonMove->add($this->body);

    return $this->teamPokemonMove->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/team_pokemon_move/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getTeamPokemonMove() {
    return $this->teamPokemonMove->get(intval($this->params['id']));
  }

  /*===================== GET ALL BY PLAYER ID ===============================*/

  #[Route("GET", "/team_pokemon_move/player_id/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getAllByPlayerID() {
    return $this->teamPokemonMove->getByPlayerID(intval($this->params['id']));
  }

  /*================== GET ALL BY PLAYER ID AND TEAM NAME ====================*/

  #[Route("GET", "/team_pokemon_move/player_id/:player_id/team/:name",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getAllByPlayerIDAndTeamName() {
    return $this->teamPokemonMove->getByPlayerIDAndTeamName(
      intval($this->params['player_id']), $this->params['name']);
  }

  /*============= GET ALL BY PLAYER ID AND TEAM NAME AND SLOT ================*/

  #[Route("GET", "/team_pokemon_move/player_id/:player_id/team/:name/slot/:slot",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getAllByPlayerIDAndTeamNameAndSlot() {
    return $this->teamPokemonMove->getByPlayerIDAndTeamNameAndSlot(
      intval($this->params['player_id']), 
      $this->params['name'], 
      $this->params['slot']
    );
  }

  /*======================= GET BY TEAM POKEMON ID ===========================*/

  #[Route("GET", "/team_pokemon_move/pokemon_id/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getByPokemonID() {
    return $this->teamPokemonMove->getByPokemonID(intval($this->params['id']));
  }

  /*========================== GET BY TEAM ID ================================*/

  #[Route("GET", "/team_pokemon_move/team_id/:id",
    middlewares: [AuthMiddleware::class])]
  public function getByTeamID() {
    return $this->teamPokemonMove->getByTeamID(intval($this->params['id']));
  }

  /*========================== GET BY TEAM ID ================================*/

  #[Route("GET", "/team_pokemon_move/team_id/:id/slot/:slot",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getByTeamIDAndSlot() {
    return $this->teamPokemonMove->getByTeamIDAndSlot(
      intval($this->params['id']), intval($this->params['slot']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/team_pokemon_move",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getTeamPokemonMoves() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->teamPokemonMove->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/team_pokemon_move/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function updateTeamPokemonMove() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->teamPokemonMove->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->teamPokemonMove->update($data, intval($id));

      # Let's return the updated teamPokemonMove
      return $this->teamPokemonMove->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/team_pokemon_move/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function deleteTeamPokemonMove() {
    return $this->teamPokemonMove->delete(intval($this->params['id']));
  }
}