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

  #[Route("POST", "/team"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createTeam() {
    $this->team->add($this->body);

    return $this->team->getLast();
  }

  /*==================== POST CREATE COMPLETE TEAM ===========================*/

  #[Route("POST", "/create_team"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createCompleteTeam() {
    $data = json_decode(file_get_contents('php://input'), true);
    $this->team->createCompleteTeam($data);

    return $this->team->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/team/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeam() {
    return $this->team->get(intval($this->params['id']));
  }

  /*========================= GET BY NAME ====================================*/

  #[Route("GET", "/team/name/:name"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeamByName() {
    return $this->team->getByName($this->params['name']);
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/team"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTeams() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->team->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/team/:id"/*,
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

      return $this->team->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= PATCH COMPLETE TEAM ============================*/

  #[Route("PATCH", "/update_team/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateCompleteTeam() {
    try {
      $id = intval($this->params['id']);
      $data = json_decode(file_get_contents('php://input'), true);

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

      $this->team->updateCompleteTeam($data, intval($id));

      return $this->team->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/team/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteTeam() {
    return $this->team->delete(intval($this->params['id']));
  }
}