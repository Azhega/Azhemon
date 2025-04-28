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

  #[Route("POST", "/back/team_pokemon_move"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createTeamPokemonMove() {
    $this->teamPokemonMove->add($this->body);

    return $this->teamPokemonMove->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/team_pokemon_move/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeamPokemonMove() {
    return $this->teamPokemonMove->get(intval($this->params['id']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/team_pokemon_move"/*,
    middlewares: [AuthMiddleware::class/*, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeamPokemonMoves() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->teamPokemonMove->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/team_pokemon_move/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
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

  #[Route("DELETE", "/back/team_pokemon_move/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteTeamPokemonMove() {
    return $this->teamPokemonMove->delete(intval($this->params['id']));
  }
}