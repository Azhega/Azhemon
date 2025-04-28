<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\AbilityModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class AbilityController extends Controller {
  protected object $ability;

  public function __construct($param) {
    $this->ability = new AbilityModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/ability"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createAbility() {
    $this->ability->add($this->body);

    return $this->ability->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/ability/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getAbility() {
    return $this->ability->get(intval($this->params['id']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/ability"/*,
    middlewares: [AuthMiddleware::class/*, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getAbilitys() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->ability->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/ability/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateAbility() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->ability->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->ability->update($data, intval($id));

      # Let's return the updated ability
      return $this->ability->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/ability/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteAbility() {
    return $this->ability->delete(intval($this->params['id']));
  }
}