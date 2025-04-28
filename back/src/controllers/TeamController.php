<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\TeamModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class TeamController extends Controller {
  protected object $team;

  public function __construct($param) {
    $this->team = new TeamModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/team"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createTeam() {
    $this->team->add($this->body);

    return $this->team->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/team/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeam() {
    return $this->team->get(intval($this->params['id']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/team"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeams() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->team->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/team/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateTeam() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->team->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->team->update($data, intval($id));

      # Let's return the updated team
      return $this->team->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/team/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteTeam() {
    return $this->team->delete(intval($this->params['id']));
  }
}