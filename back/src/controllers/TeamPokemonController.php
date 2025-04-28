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

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/team_pokemon"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeamPokemons() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->teamPokemon->getAll($limit);
  }

  /*========================= PATCH =========================================*/

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