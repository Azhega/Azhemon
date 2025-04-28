<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\SpeciesAbilityModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class SpeciesAbilityController extends Controller {
  protected object $speciesAbility;

  public function __construct($param) {
    $this->speciesAbility = new SpeciesAbilityModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/species_ability"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createSpeciesAbility() {
    $this->speciesAbility->add($this->body);

    return $this->speciesAbility->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/species_ability/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getSpeciesAbility() {
    return $this->speciesAbility->get(intval($this->params['id']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/species_ability"/*,
    middlewares: [AuthMiddleware::class/*, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getSpeciesAbilitys() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->speciesAbility->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/species_ability/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateSpeciesAbility() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->speciesAbility->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->speciesAbility->update($data, intval($id));

      # Let's return the updated speciesAbility
      return $this->speciesAbility->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/species_ability/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteSpeciesAbility() {
    return $this->speciesAbility->delete(intval($this->params['id']));
  }
}