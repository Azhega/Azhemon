<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\SpeciesMoveModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class SpeciesMoveController extends Controller {
  protected object $speciesMove;

  public function __construct($param) {
    $this->speciesMove = new SpeciesMoveModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/species_move"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createSpeciesMove() {
    $this->speciesMove->add($this->body);

    return $this->speciesMove->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/species_move/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getSpeciesMove() {
    return $this->speciesMove->get(intval($this->params['id']));
  }

  /*====================== GET MOVE BY POKEMON NAME ==========================*/

  #[Route("GET", "/back/species_move/pokemon_name/:name"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getSpeciesMoveByPokemonName() {
    return $this->speciesMove->getMoveByPokemonName($this->params['name']);
  }

  /*====================== GET POKEMON BY NAME MOVE ==========================*/

  #[Route("GET", "/back/species_move/move_name/:name"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getPokemonByMoveName() {
    return $this->speciesMove->getPokemonByMoveName($this->params['name']);
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/species_move"/*,
    middlewares: [AuthMiddleware::class/*, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getSpeciesMoves() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->speciesMove->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/species_move/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateSpeciesMove() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->speciesMove->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->speciesMove->update($data, intval($id));

      # Let's return the updated speciesMove
      return $this->speciesMove->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/species_move/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteSpeciesMove() {
    return $this->speciesMove->delete(intval($this->params['id']));
  }
}